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
 *
 * Defensas anti-abuse acotadas (decisión de producto: sin captcha):
 *  - Honeypot field `website` en el schema. Si llega no-vacío,
 *    descartamos silenciosamente con 200 fake (no le damos pista al
 *    bot).
 *  - Origin/Referer check contra `NEXT_PUBLIC_APP_URL` para cortar el
 *    vector "sitio tercero hace fetch cross-origin desde browser".
 *    Defense parcial — un atacante con backend propio sin browser la
 *    evita, pero corta el caso bot-on-third-party-site.
 *
 * Falta (registrado en BACKLOG como deuda ALTA): rate limit IP-based,
 * GDPR consent + Datenschutzerklärung, security headers globales.
 */

import { NextResponse } from "next/server"
import { getTranslations } from "next-intl/server"
import { env } from "@/lib/env"
import {
  contactRequestSchema,
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

/**
 * Chequea que el POST venga del mismo origen del sitio. Cierra el
 * vector "browser de un tercero hace fetch cross-origin a /api/contact"
 * que de otra forma habilitaría a bots distribuidos sin infra propia.
 * No es defensa completa (un atacante con backend la evita), pero corta
 * el path browser-based con cero costo.
 */
function isAllowedOrigin(request: Request): boolean {
  const expected = env.NEXT_PUBLIC_APP_URL
  if (!expected) return true // sin app URL configurada → no podemos comparar
  const origin = request.headers.get("origin")
  if (origin) {
    try {
      return new URL(origin).origin === new URL(expected).origin
    } catch {
      return false
    }
  }
  // Si no hay Origin (algunos clientes), probar con Referer como fallback.
  const referer = request.headers.get("referer")
  if (referer) {
    try {
      return new URL(referer).origin === new URL(expected).origin
    } catch {
      return false
    }
  }
  // Sin Origin ni Referer: rechazar conservadoramente (browsers reales
  // mandan al menos uno en POSTs).
  return false
}

/** "200 fake" para honeypot trips: respondemos como si todo OK pero NO
 * disparamos el email. Sin pista para el bot. */
function fakeOk() {
  return NextResponse.json({ data: { success: true } })
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const result = contactRequestSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "validation_error", issues: result.error.issues },
      { status: 400 }
    )
  }

  // Honeypot trip: bot completó el campo invisible. Fake 200, sin email.
  if (result.data.website && result.data.website.trim() !== "") {
    return fakeOk()
  }

  const locale = pickLocale(request.headers.get("x-locale"))
  const typeLabel = await resolveTypeLabel(result.data.type, locale)

  // Await el envío del email — si Resend falla, queremos saberlo antes
  // de devolver 200 al cliente. El catch loggea estructurado para que
  // se pueda diagnosticar sin filtrar PII al log (no logueamos `name`,
  // `email` ni `message` — solo metadata mínima para correlacionar con
  // el dashboard de Resend).
  //
  // Trade-off: el user espera el roundtrip de Resend (~200-400ms extra)
  // antes de ver el toast de éxito. Aceptable para este formulario de
  // baja frecuencia; si en el futuro hay carga, mover a queue (Trigger.dev
  // job real) y devolver 202 con tracking id.
  try {
    await triggerContactNotification({
      to: env.CONTACT_RECIPIENT_EMAIL,
      name: result.data.name,
      email: result.data.email,
      type: result.data.type,
      typeLabel,
      message: result.data.message,
      locale,
    })
  } catch (error) {
    // Whitelist explícito de campos del error — NO serializamos el objeto
    // crudo porque `error.message` / `error.cause` pueden traer eco del
    // payload del user (snippets del body que falló al enviar). Solo
    // logueamos `name` (clase del error: TypeError, NetworkError, etc),
    // que es info diagnóstica sin PII.
    const safeError =
      error instanceof Error
        ? { errorName: error.name }
        : { errorType: typeof error }
    console.error("contact_notification_failed", {
      ...safeError,
      recipient: env.CONTACT_RECIPIENT_EMAIL,
      type: result.data.type,
      locale,
    })
    return NextResponse.json(
      { error: "notification_failed" },
      { status: 502 }
    )
  }

  return NextResponse.json({ data: { success: true } })
}
