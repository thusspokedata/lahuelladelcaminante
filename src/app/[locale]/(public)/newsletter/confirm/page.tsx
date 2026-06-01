/**
 * `/newsletter/confirm` — página de confirmación de suscripción al newsletter.
 *
 * Server Component: confirma la suscripción directamente en el servidor al
 * renderizar la página. Evita el problema de GET-que-muta-estado en un
 * API route puro (los scanners de email no ejecutan JS ni renderizan páginas
 * completas en Next.js App Router).
 *
 * Siempre redirige — nunca renderiza HTML visible.
 */

import { redirect } from "next/navigation"
import { verifyNewsletterToken } from "@/lib/newsletter-jwt"
import { getResend } from "@/lib/email"

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function NewsletterConfirmPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params
  const { token } = await searchParams

  if (!token) {
    redirect(`/${locale}/newsletter?error=invalid_token`)
  }

  let payload: { email: string; language: string; contactId: string }
  try {
    payload = await verifyNewsletterToken(token)
  } catch (err) {
    const name = err instanceof Error ? err.name : ""
    const isExpired = name === "JWTExpired"
    redirect(
      `/${locale}/newsletter?error=${isExpired ? "token_expired" : "invalid_token"}`
    )
  }

  const resend = getResend()
  const { error } = await resend.contacts.update({
    id: payload.contactId,
    unsubscribed: false,
  })

  if (error) {
    console.error("newsletter_confirm_update_failed", { error })
    redirect(`/${payload.language}/newsletter?error=confirm_failed`)
  }

  redirect(`/${payload.language}/newsletter?confirmed=true`)
}
