/**
 * GET `/api/newsletter/confirm?token=<jwt>`
 *
 * Verifica el JWT de confirmación, activa la suscripción en Resend
 * (unsubscribed → false), y redirige a la página del newsletter
 * con el estado correspondiente.
 *
 * Redirects:
 *  - OK → /[lang]/newsletter?confirmed=true
 *  - Token expirado → /[lang]/newsletter?error=token_expired
 *  - Token inválido → /[lang]/newsletter?error=invalid_token
 */

import { NextResponse } from "next/server"
import { verifyNewsletterToken } from "@/lib/newsletter-jwt"
import { getResend } from "@/lib/email"
import { env } from "@/lib/env"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const appUrl = env.NEXT_PUBLIC_APP_URL

  function redirectTo(lang: string, params: string) {
    return NextResponse.redirect(`${appUrl}/${lang}/newsletter?${params}`)
  }

  if (!token) {
    return redirectTo("es", "error=invalid_token")
  }

  let payload: { email: string; language: string; contactId: string }
  try {
    payload = await verifyNewsletterToken(token)
  } catch (err) {
    const name = err instanceof Error ? err.name : ""
    const isExpired = name === "JWTExpired"
    return redirectTo("es", isExpired ? "error=token_expired" : "error=invalid_token")
  }

  const { email, language } = payload
  const resend = getResend()

  try {
    await resend.contacts.update({ email, unsubscribed: false })
  } catch (err) {
    console.error("newsletter_confirm_update_failed", {
      errorName: err instanceof Error ? err.name : typeof err,
    })
    return redirectTo(language, "error=confirm_failed")
  }

  return redirectTo(language, "confirmed=true")
}
