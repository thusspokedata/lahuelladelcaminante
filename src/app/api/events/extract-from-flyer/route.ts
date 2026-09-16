/**
 * POST /api/events/extract-from-flyer
 *
 * Server-only. Recibe la URL (de NUESTRA Cloudinary) de un flyer ya subido y
 * usa la Messages API de Anthropic (Sonnet) para extraer los campos del evento.
 * NO persiste nada ni toca el save flow: el cliente prefila el form y el user
 * revisa/guarda por el camino existente (`POST /api/events`).
 *
 * Auth: creator o admin (mismo set que la página de crear evento). Devuelve
 * JSON 401/403 (no redirect) para que el cliente lo maneje.
 *
 * Body (zod): { imageUrl: string, locale: "es" | "en" | "de" }.
 *
 * Anti-abuso: rechaza cualquier imageUrl que no sea https de nuestra cloud de
 * Cloudinary (ver `isAllowedCloudinaryUrl`), para que el endpoint no sirva
 * para hacernos pagar el análisis de imágenes arbitrarias.
 *
 * Structured output: una única tool `extract_event` con `tool_choice` forzado,
 * cuyo `input_schema` matchea `ExtractedEvent`. La imagen se pasa como bloque
 * `image` con `source: { type: "url", url }`.
 *
 * Response shape (estable):
 *   200 { data: ExtractedEvent }               // OK, o flyer ilegible ⇒ campos vacíos
 *   400 { error, code }                        // json inválido / body inválido / url no permitida
 *   401 { error, code: "UNAUTHORIZED" }
 *   403 { error, code: "FORBIDDEN" }
 *   429 { error, code: "RATE_LIMITED" }         // throttle por-usuario in-memory
 *   500 { error, code: "MISSING_API_KEY" }     // falta ANTHROPIC_API_KEY
 *   502 { error, code: "ANTHROPIC_ERROR" }     // fallo llamando a Anthropic
 */
export const runtime = "nodejs"

import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser, isCreatorOrAdmin } from "@/services/auth"
import { isAllowedCloudinaryUrl } from "@/lib/cloudinary-url"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  EXTRACT_EVENT_TOOL,
  EXTRACT_EVENT_TOOL_NAME,
  buildExtractionPrompt,
  parseExtraction,
} from "@/lib/flyer-extraction"

const bodySchema = z.object({
  imageUrl: z.string().url(),
  locale: z.enum(["es", "en", "de"]),
})

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const DEFAULT_MODEL = "claude-sonnet-4-6"

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    )
  }
  if (!isCreatorOrAdmin(user.role)) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "invalid_json", code: "INVALID_JSON" },
      { status: 400 }
    )
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_error",
        code: "VALIDATION_ERROR",
        issues: parsed.error.issues,
      },
      { status: 400 }
    )
  }

  const { imageUrl, locale } = parsed.data

  if (!isAllowedCloudinaryUrl(imageUrl, CLOUD_NAME)) {
    return NextResponse.json(
      { error: "invalid_image_url", code: "INVALID_IMAGE_URL" },
      { status: 400 }
    )
  }

  // Throttle in-memory por-USUARIO (no por IP) para evitar hammering accidental
  // de este endpoint caro (cada request dispara una llamada a Anthropic con
  // costo). Keyeamos por `user.id` para que el límite sea por cuenta creator y
  // no compartido entre todas. Un quota de billing durable (persistido en DB)
  // es un posible follow-up futuro — acá alcanza con un throttle en memoria.
  const rate = checkRateLimit(`flyer-extract:${user.id}`, {
    windowMs: 5 * 60_000,
    maxRequests: 10,
  })
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate_limited", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      }
    )
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Falta ANTHROPIC_API_KEY en el servidor.",
        code: "MISSING_API_KEY",
      },
      { status: 500 }
    )
  }

  const model = process.env.EVENT_EXTRACT_MODEL ?? DEFAULT_MODEL
  const client = new Anthropic({ apiKey, timeout: 60_000 })

  let toolInput: unknown
  try {
    const message = await client.messages.create({
      model,
      max_tokens: 1500,
      tools: [EXTRACT_EVENT_TOOL],
      tool_choice: { type: "tool", name: EXTRACT_EVENT_TOOL_NAME },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: imageUrl } },
            { type: "text", text: buildExtractionPrompt(locale) },
          ],
        },
      ],
    })

    const toolUse = message.content.find((block) => block.type === "tool_use")
    if (!toolUse || toolUse.type !== "tool_use") {
      // El modelo no produjo structured output: devolvemos campos vacíos (200)
      // para que el cliente muestre un toast suave sin romper el form.
      return NextResponse.json({ data: parseExtraction({}) })
    }
    toolInput = toolUse.input
  } catch {
    return NextResponse.json(
      { error: "extraction_failed", code: "ANTHROPIC_ERROR" },
      { status: 502 }
    )
  }

  const data = parseExtraction(toolInput)
  return NextResponse.json({ data })
}
