/**
 * POST `/api/contact` — recibe el form de `/contact`, valida con el
 * schema compartido y dispara el email al founder via Resend.
 *
 * No persiste en DB (decisión de producto — los mensajes se manejan
 * desde la inbox del founder, no hay sistema de "tickets" interno).
 *
 * El label legible del tipo (`typeLabel`, que termina en el subject
 * del email) se resuelve del namespace i18n `contact.form.types.*`
 * usando el locale del request. Esto evita que el founder reciba mails
 * con keys técnicas como `[Contacto · event_suggestion]`.
 */

import { NextResponse } from "next/server"
import { getTranslations } from "next-intl/server"
import { env } from "@/lib/env"
import {
  contactSchema,
  CONTACT_TYPE_I18N_KEY,
  type ContactType,
} from "@/lib/validators/contact"
import { triggerContactNotification } from "@/lib/trigger"

async function resolveTypeLabel(type: ContactType, locale: string): Promise<string> {
  const t = await getTranslations({ locale, namespace: "contact.form.types" })
  return t(CONTACT_TYPE_I18N_KEY[type])
}

function pickLocale(headerValue: string | null): string {
  // El cliente manda `x-locale` con el locale activo del request (es/en/de).
  // Fallback `es` (locale canónico del proyecto) si el header no llega o no
  // matchea — no afecta la entrega, solo el idioma del label que aparece
  // en el subject.
  const fallback = "es"
  if (!headerValue) return fallback
  return ["es", "en", "de"].includes(headerValue) ? headerValue : fallback
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const result = contactSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "validation_error", issues: result.error.issues },
      { status: 400 }
    )
  }

  const locale = pickLocale(request.headers.get("x-locale"))
  const typeLabel = await resolveTypeLabel(result.data.type, locale)

  // Fire-and-forget igual que `/apply` — si Resend falla, no queremos
  // bloquear al user con un 500. El catch silencioso es deuda conocida
  // del patrón existente; cuando se agregue logging estructurado, atar
  // acá también.
  triggerContactNotification({
    to: env.CONTACT_RECIPIENT_EMAIL,
    name: result.data.name,
    email: result.data.email,
    type: result.data.type,
    typeLabel,
    message: result.data.message,
    locale,
  }).catch(() => {})

  return NextResponse.json({ data: { success: true } })
}
