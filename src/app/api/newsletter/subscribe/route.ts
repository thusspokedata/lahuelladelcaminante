/**
 * POST `/api/newsletter/subscribe`
 *
 * Recibe el form de suscripción al newsletter, valida, crea el contacto
 * en Resend (unsubscribed=true hasta confirmar), genera un JWT de 24h,
 * y envía el email de confirmación (doble opt-in).
 *
 * Defensas: origin check + rate limit + honeypot (mismo patrón que /api/contact).
 *
 * Casos edge:
 *  - Email ya suscripto (unsubscribed=false) → 200 sin reenviar.
 *  - Email existe en Resend pero unsubscribed → reenvía confirmación.
 *  - Email nuevo → crea contacto + envía confirmación.
 */

import { NextResponse } from "next/server"
import { env } from "@/lib/env"
import { newsletterRequestSchema } from "@/lib/validators/newsletter"
import { signNewsletterToken } from "@/lib/newsletter-jwt"
import { buildConfirmationEmail } from "@/lib/newsletter-emails"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { getResend } from "@/lib/email"

function isAllowedOrigin(request: Request): boolean {
  const expected = env.NEXT_PUBLIC_APP_URL
  if (!expected) return true
  const origin = request.headers.get("origin")
  if (origin) {
    try {
      return new URL(origin).origin === new URL(expected).origin
    } catch {
      return false
    }
  }
  const referer = request.headers.get("referer")
  if (referer) {
    try {
      return new URL(referer).origin === new URL(expected).origin
    } catch {
      return false
    }
  }
  return false
}

function fakeOk() {
  return NextResponse.json({ data: { success: true } })
}

function segmentIdForLang(lang: string): string | null {
  if (lang === "es") return env.RESEND_SEGMENT_ID_ES || null
  if (lang === "en") return env.RESEND_SEGMENT_ID_EN || null
  if (lang === "de") return env.RESEND_SEGMENT_ID_DE || null
  return null
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 })
  }

  const rate = checkRateLimit(getClientIp(request.headers))
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rate.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const result = newsletterRequestSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "validation_error", issues: result.error.issues },
      { status: 400 }
    )
  }

  if (result.data.website && result.data.website.trim() !== "") {
    return fakeOk()
  }

  const { email, language } = result.data
  const resend = getResend()
  const segmentId = segmentIdForLang(language)

  // Direct lookup by email — avoids pagination truncation of contacts.list
  let existingContactId: string | null = null
  let isAlreadySubscribed = false

  try {
    const { data: existing } = await resend.contacts.get({ email })
    if (existing?.id) {
      existingContactId = existing.id
      isAlreadySubscribed = !existing.unsubscribed
    }
  } catch {
    // Contact not found or error — proceed to create
  }

  if (isAlreadySubscribed) {
    return NextResponse.json({ data: { success: true } })
  }

  let contactId = existingContactId
  if (!contactId) {
    try {
      const { data: created, error } = await resend.contacts.create({
        email,
        unsubscribed: true,
        firstName: "",
        lastName: "",
      })
      if (error || !created?.id) {
        console.error("newsletter_create_contact_failed", { errorName: "CreateContactError" })
        return NextResponse.json({ error: "subscription_failed" }, { status: 502 })
      }
      contactId = created.id

      if (segmentId) {
        await resend.contacts.segments.add({ email, segmentId }).catch((err) => {
          console.error("newsletter_add_segment_failed", {
            errorName: err instanceof Error ? err.name : typeof err,
          })
        })
      }
    } catch (err) {
      console.error("newsletter_create_contact_failed", {
        errorName: err instanceof Error ? err.name : typeof err,
      })
      return NextResponse.json({ error: "subscription_failed" }, { status: 502 })
    }
  }

  const token = await signNewsletterToken({ email, language, contactId })
  const appUrl = env.NEXT_PUBLIC_APP_URL
  const confirmUrl = `${appUrl}/${language}/newsletter/confirm?token=${encodeURIComponent(token)}`
  const { subject, html } = buildConfirmationEmail(language, confirmUrl)

  try {
    await resend.emails.send({
      from: "La Huella del Caminante <noreply@lahuelladelcaminante.de>",
      to: email,
      subject,
      html,
    })
  } catch (err) {
    console.error("newsletter_confirm_email_failed", {
      errorName: err instanceof Error ? err.name : typeof err,
    })
    return NextResponse.json({ error: "email_send_failed" }, { status: 502 })
  }

  return NextResponse.json({ data: { success: true } })
}
