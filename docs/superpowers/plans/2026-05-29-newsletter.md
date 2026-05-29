# Newsletter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar newsletter con doble opt-in (ES/EN/DE), formulario en footer + página `/newsletter`, y digest semanal automático de eventos próximos.

**Architecture:** Resend v6 Contacts + Segments (3 segments, uno por idioma). JWT firmados con `jose` (ya instalado) para tokens de confirmación de 24h. Digest disparado por endpoint protegido `/api/newsletter/digest` + cron en VPS (lunes 8AM UTC).

**Tech Stack:** Resend v6 SDK (contacts + segments), jose v6 (JWT HS256), Zod, next-intl, Next.js App Router API routes, VPS crontab.

---

## Prerequisito manual (hacer ANTES de empezar)

El dev debe crear en el dashboard de Resend (https://resend.com/contacts):
1. Tres **Segments**: `newsletter-es`, `newsletter-en`, `newsletter-de`
2. Copiar los 3 IDs de segment y agregarlos al `.env.local` del VPS y local

No hay código que hacer acá — es configuración en el dashboard de Resend.

---

## Task 1: Variables de entorno + env.ts

**Files:**
- Modify: `src/lib/env.ts`
- Modify: `.env.local.example`

- [ ] **Step 1: Agregar vars a `.env.local.example`**

```env
# Newsletter (Resend Segments — uno por idioma)
RESEND_SEGMENT_ID_ES=
RESEND_SEGMENT_ID_EN=
RESEND_SEGMENT_ID_DE=
# JWT secret para tokens de confirmación de suscripción (min 32 chars)
NEWSLETTER_JWT_SECRET=
# Secret para autorizar el endpoint /api/newsletter/digest (llamado por cron)
DIGEST_CRON_SECRET=
```

- [ ] **Step 2: Agregar vars al schema Zod en `src/lib/env.ts`**

Agregar dentro de `envSchema`:

```ts
  RESEND_SEGMENT_ID_ES: z.string().optional().default(""),
  RESEND_SEGMENT_ID_EN: z.string().optional().default(""),
  RESEND_SEGMENT_ID_DE: z.string().optional().default(""),
  NEWSLETTER_JWT_SECRET: z.string().optional().default(""),
  DIGEST_CRON_SECRET: z.string().optional().default(""),
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/env.ts .env.local.example
git commit -S -m "feat(newsletter): env vars — segment IDs + JWT + digest secret"
```

---

## Task 2: Zod validator

**Files:**
- Create: `src/lib/validators/newsletter.ts`

- [ ] **Step 1: Crear el archivo**

```ts
/**
 * Schemas Zod para el form de suscripción al newsletter.
 *
 * Dos schemas — mismo patrón que validators/contact.ts:
 *  - `newsletterSchema`: contrato user-facing (sin honeypot).
 *  - `newsletterRequestSchema`: agrega honeypot `website` para el server.
 */

import { z } from "zod"

export const NEWSLETTER_LANGUAGES = ["es", "en", "de"] as const
export type NewsletterLanguage = (typeof NEWSLETTER_LANGUAGES)[number]

/** Schema user-facing — sin honeypot. */
export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "email_invalid" })
    .max(254, { message: "email_too_long" }),
  language: z.enum(NEWSLETTER_LANGUAGES, { message: "language_invalid" }),
})

export type NewsletterInput = z.infer<typeof newsletterSchema>

/** Schema server-side — agrega honeypot. */
export const newsletterRequestSchema = newsletterSchema.extend({
  website: z.string().optional(),
})

export type NewsletterRequest = z.infer<typeof newsletterRequestSchema>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validators/newsletter.ts
git commit -S -m "feat(newsletter): Zod validator — email + language + honeypot"
```

---

## Task 3: JWT helpers

**Files:**
- Create: `src/lib/newsletter-jwt.ts`

`jose` v6 ya está instalado como dependencia transitiva de better-auth. No requiere `npm install`.

- [ ] **Step 1: Crear el archivo**

```ts
/**
 * Helpers para firmar y verificar JWT de confirmación de suscripción al
 * newsletter. Usa `jose` (ya instalado por better-auth) con HS256.
 *
 * El token viaja en el link de confirmación:
 *   GET /api/newsletter/confirm?token=<jwt>
 *
 * Payload: { email, language, contactId }
 * Expira en 24h. Si expira → redirect a /[locale]/newsletter?error=token_expired.
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose"

export interface NewsletterTokenPayload extends JWTPayload {
  email: string
  language: string
  contactId: string
}

function getSecret(): Uint8Array {
  const secret = process.env.NEWSLETTER_JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("NEWSLETTER_JWT_SECRET not set or too short (min 32 chars)")
  }
  return new TextEncoder().encode(secret)
}

/**
 * Firma un token JWT de confirmación. Expira en 24h.
 */
export async function signNewsletterToken(payload: {
  email: string
  language: string
  contactId: string
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret())
}

/**
 * Verifica un token JWT de confirmación.
 * Lanza si el token es inválido o expiró.
 */
export async function verifyNewsletterToken(
  token: string
): Promise<NewsletterTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as NewsletterTokenPayload
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/newsletter-jwt.ts
git commit -S -m "feat(newsletter): JWT sign/verify helpers (jose HS256, 24h exp)"
```

---

## Task 4: Email templates

**Files:**
- Create: `src/lib/newsletter-emails.ts`

Sigue el patrón visual de los emails existentes en `src/lib/trigger.ts`.

- [ ] **Step 1: Crear el archivo**

```ts
/**
 * Builders de HTML para los emails del newsletter.
 *
 * NO usa next-intl (los emails se generan fuera del contexto de request
 * — desde el cron o desde el route handler del confirm). El contenido
 * está hardcodeado en los 3 idiomas, mismo patrón que los emails
 * existentes en `src/lib/trigger.ts`.
 *
 * Dos templates:
 *  - buildConfirmationEmail(lang, confirmUrl) → email de doble opt-in
 *  - buildDigestEmail(lang, events) → digest semanal de eventos
 */

import { escapeHtml } from "./newsletter-escape"

export type DigestEvent = {
  title: string
  slug: string
  /** ISO string de la fecha más próxima */
  nextDate: string
  location: string
  coverImage: string | null
}

// ─── Strings por idioma ───────────────────────────────────────────────────────

const STRINGS = {
  es: {
    confirmSubject: "Confirmá tu suscripción al newsletter",
    confirmHeading: "Confirmá tu suscripción",
    confirmBody:
      "Hacé click en el botón para empezar a recibir el newsletter semanal de eventos latinos en Berlín.",
    confirmCta: "Confirmar suscripción →",
    confirmExpiry: "El link expira en 24 horas.",
    confirmIgnore: "Si no pediste esto, ignorá este email.",
    digestSubject: "Eventos de la semana — La Huella del Caminante",
    digestHeading: "Eventos de la semana",
    digestViewEvent: "Ver evento →",
    digestViewAll: "Ver todos los eventos →",
    digestUnsubscribe: "Cancelar suscripción",
  },
  en: {
    confirmSubject: "Confirm your newsletter subscription",
    confirmHeading: "Confirm your subscription",
    confirmBody:
      "Click the button to start receiving the weekly newsletter of Latin events in Berlin.",
    confirmCta: "Confirm subscription →",
    confirmExpiry: "The link expires in 24 hours.",
    confirmIgnore: "If you didn't request this, ignore this email.",
    digestSubject: "Events of the week — La Huella del Caminante",
    digestHeading: "Events of the week",
    digestViewEvent: "View event →",
    digestViewAll: "View all events →",
    digestUnsubscribe: "Unsubscribe",
  },
  de: {
    confirmSubject: "Bestätige deine Newsletter-Anmeldung",
    confirmHeading: "Anmeldung bestätigen",
    confirmBody:
      "Klicke auf den Button, um den wöchentlichen Newsletter für lateinamerikanische Events in Berlin zu erhalten.",
    confirmCta: "Anmeldung bestätigen →",
    confirmExpiry: "Der Link läuft in 24 Stunden ab.",
    confirmIgnore: "Falls du das nicht angefordert hast, ignoriere diese E-Mail.",
    digestSubject: "Events der Woche — La Huella del Caminante",
    digestHeading: "Events der Woche",
    digestViewEvent: "Event ansehen →",
    digestViewAll: "Alle Events ansehen →",
    digestUnsubscribe: "Newsletter abbestellen",
  },
} as const

type Lang = keyof typeof STRINGS

function getLang(lang: string): Lang {
  return (["es", "en", "de"] as const).includes(lang as Lang)
    ? (lang as Lang)
    : "es"
}

// ─── Email wrapper HTML ───────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0407;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#130609;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
        ${content}
        <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:18px 32px;text-align:center">
          <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0">
            <a href="https://lahuelladelcaminante.de" style="color:rgba(255,255,255,0.3);text-decoration:none">lahuelladelcaminante.de</a>
            &nbsp;·&nbsp; Berlín
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function emailHeader(heading: string): string {
  return `<tr><td style="background:linear-gradient(135deg,#7a1a0e 0%,#c0392b 50%,#7a1a0e 100%);padding:40px 32px;text-align:center">
    <p style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px">La Huella del Caminante</p>
    <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin:0;line-height:1.2">${escapeHtml(heading)}</h1>
  </td></tr>`
}

// ─── Email A: Confirmación ────────────────────────────────────────────────────

export function buildConfirmationEmail(
  lang: string,
  confirmUrl: string
): { subject: string; html: string } {
  const s = STRINGS[getLang(lang)]

  const body = `
    ${emailHeader(s.confirmHeading)}
    <tr><td style="padding:36px 32px">
      <p style="color:#c4a9a4;font-size:15px;margin:0 0 28px;line-height:1.7">${escapeHtml(s.confirmBody)}</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding-bottom:28px">
          <a href="${confirmUrl}"
             style="display:inline-block;background:#c0392b;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:8px">
            ${escapeHtml(s.confirmCta)}
          </a>
        </td></tr>
      </table>
      <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0 0 8px;text-align:center">${escapeHtml(s.confirmExpiry)}</p>
      <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;text-align:center">${escapeHtml(s.confirmIgnore)}</p>
    </td></tr>`

  return { subject: s.confirmSubject, html: emailWrapper(body) }
}

// ─── Email B: Digest semanal ──────────────────────────────────────────────────

function formatDigestDate(isoDate: string, lang: Lang): string {
  const locale = lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "es-AR"
  try {
    return new Date(isoDate).toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  } catch {
    return isoDate
  }
}

export function buildDigestEmail(
  lang: string,
  events: DigestEvent[],
  hasMore: boolean,
  appUrl: string
): { subject: string; html: string } {
  const s = STRINGS[getLang(lang)]
  const l = getLang(lang)

  const eventCards = events
    .map((ev) => {
      const eventUrl = `${appUrl}/${lang}/events/${encodeURIComponent(ev.slug)}`
      const dateStr = formatDigestDate(ev.nextDate, l)
      const img = ev.coverImage
        ? `<td width="80" style="padding:0 16px 0 0;vertical-align:top">
             <img src="${escapeHtml(ev.coverImage)}" width="80" height="80"
               style="border-radius:8px;object-fit:cover;display:block" alt="">
           </td>`
        : ""

      return `<tr><td style="padding:0 0 16px 0">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#1a0c10;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.06)">
          <tr>
            ${img}
            <td style="padding:16px;vertical-align:top">
              <p style="color:#ffffff;font-size:16px;font-weight:700;margin:0 0 4px;line-height:1.3">${escapeHtml(ev.title)}</p>
              <p style="color:#c0392b;font-size:13px;font-weight:600;margin:0 0 2px">${escapeHtml(dateStr)}</p>
              <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0 0 12px">${escapeHtml(ev.location)}</p>
              <a href="${eventUrl}"
                 style="color:#c0392b;font-size:13px;font-weight:700;text-decoration:none">
                ${escapeHtml(s.digestViewEvent)}
              </a>
            </td>
          </tr>
        </table>
      </td></tr>`
    })
    .join("")

  const viewAllRow = hasMore
    ? `<tr><td style="padding:8px 0 0;text-align:center">
        <a href="${appUrl}/${lang}/events"
           style="color:rgba(255,255,255,0.5);font-size:13px;text-decoration:underline">
          ${escapeHtml(s.digestViewAll)}
        </a>
       </td></tr>`
    : ""

  const body = `
    ${emailHeader(s.digestHeading)}
    <tr><td style="padding:28px 32px">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${eventCards}
        ${viewAllRow}
        <tr><td style="padding:20px 0 0;text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
          <a href="{{{RESEND_UNSUBSCRIBE_URL}}}"
             style="color:rgba(255,255,255,0.3);font-size:12px;text-decoration:underline">
            ${escapeHtml(s.digestUnsubscribe)}
          </a>
        </td></tr>
      </table>
    </td></tr>`

  return { subject: s.digestSubject, html: emailWrapper(body) }
}
```

- [ ] **Step 2: Crear `src/lib/newsletter-escape.ts`** (helper `escapeHtml` extraído para no duplicar)

```ts
/**
 * Escape mínimo para interpolar strings en HTML de email.
 * Mismo patrón que `escapeHtml` en `src/lib/trigger.ts` pero exportado
 * como módulo separado para compartirlo entre trigger.ts y newsletter-emails.ts.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
```

- [ ] **Step 3: Actualizar `src/lib/trigger.ts` para importar `escapeHtml` desde el módulo compartido**

En `src/lib/trigger.ts`, reemplazar la función `escapeHtml` local al final del archivo:

```ts
// ELIMINAR la función local:
// function escapeHtml(s: string): string { ... }

// AGREGAR al principio del archivo (después de los imports existentes):
import { escapeHtml } from "./newsletter-escape"
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/newsletter-emails.ts src/lib/newsletter-escape.ts src/lib/trigger.ts
git commit -S -m "feat(newsletter): email templates ES/EN/DE + escapeHtml compartido"
```

---

## Task 5: Subscribe API route

**Files:**
- Create: `src/app/api/newsletter/subscribe/route.ts`

- [ ] **Step 1: Crear el archivo**

```ts
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

/** Devuelve el ID de segment de Resend según idioma. */
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

  // Honeypot
  if (result.data.website && result.data.website.trim() !== "") {
    return fakeOk()
  }

  const { email, language } = result.data
  const resend = getResend()
  const segmentId = segmentIdForLang(language)

  // 1. Verificar si ya existe y está confirmado
  let existingContactId: string | null = null
  let isAlreadySubscribed = false

  if (segmentId) {
    try {
      const { data: list } = await resend.contacts.list({ segmentId })
      const existing = list?.data?.find((c) => c.email === email)
      if (existing) {
        existingContactId = existing.id
        isAlreadySubscribed = !existing.unsubscribed
      }
    } catch (err) {
      console.error("newsletter_list_contacts_failed", {
        errorName: err instanceof Error ? err.name : typeof err,
      })
      // Continuar de todas formas — si no podemos verificar, intentamos crear
    }
  }

  if (isAlreadySubscribed) {
    // Ya confirmado — no reenviar, responder éxito silencioso
    return NextResponse.json({ data: { success: true } })
  }

  // 2. Crear contacto si no existe
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

      // Agregar al segment del idioma
      if (segmentId) {
        await resend.contacts.segments.add({ email, segmentId }).catch((err) => {
          console.error("newsletter_add_segment_failed", {
            errorName: err instanceof Error ? err.name : typeof err,
          })
          // No crítico — el contacto se creó, el digest puede buscarlo por email
        })
      }
    } catch (err) {
      console.error("newsletter_create_contact_failed", {
        errorName: err instanceof Error ? err.name : typeof err,
      })
      return NextResponse.json({ error: "subscription_failed" }, { status: 502 })
    }
  }

  // 3. Generar JWT
  const token = await signNewsletterToken({ email, language, contactId })

  // 4. Enviar email de confirmación
  const appUrl = env.NEXT_PUBLIC_APP_URL
  const confirmUrl = `${appUrl}/api/newsletter/confirm?token=${encodeURIComponent(token)}`
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/newsletter/subscribe/route.ts
git commit -S -m "feat(newsletter): POST /api/newsletter/subscribe — doble opt-in"
```

---

## Task 6: Confirm API route

**Files:**
- Create: `src/app/api/newsletter/confirm/route.ts`

- [ ] **Step 1: Crear el archivo**

```ts
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
    // jose lanza JWTExpired para tokens expirados, JWTInvalid para malformados
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/newsletter/confirm/route.ts
git commit -S -m "feat(newsletter): GET /api/newsletter/confirm — activa suscripción"
```

---

## Task 7: Digest API route

**Files:**
- Create: `src/app/api/newsletter/digest/route.ts`

Este endpoint es llamado por un cron del VPS cada lunes a las 8AM UTC.
Está protegido por `Authorization: Bearer <DIGEST_CRON_SECRET>`.

- [ ] **Step 1: Crear el archivo**

```ts
/**
 * POST `/api/newsletter/digest`
 *
 * Genera y envía el digest semanal de eventos próximos (15 días).
 * Llamado por cron del VPS: `0 8 * * 1 curl -s -X POST https://... -H "Authorization: Bearer $SECRET"`
 *
 * Flujo:
 *  1. Valida Authorization header
 *  2. Busca eventos próximos 15 días en Prisma
 *  3. Si no hay eventos → exit (log + 200)
 *  4. Por cada idioma (es/en/de) con suscriptores activos → envía digest
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getResend } from "@/lib/email"
import { buildDigestEmail, type DigestEvent } from "@/lib/newsletter-emails"
import { env } from "@/lib/env"
import { startOfTodayBerlin } from "@/lib/date"

const LANGUAGES = ["es", "en", "de"] as const
const MAX_EVENTS = 5

function segmentIdForLang(lang: string): string | null {
  if (lang === "es") return env.RESEND_SEGMENT_ID_ES || null
  if (lang === "en") return env.RESEND_SEGMENT_ID_EN || null
  if (lang === "de") return env.RESEND_SEGMENT_ID_DE || null
  return null
}

export async function POST(request: Request) {
  // Auth check
  const auth = request.headers.get("authorization")
  const expected = env.DIGEST_CRON_SECRET
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // 1. Fetch próximos eventos (15 días)
  const today = startOfTodayBerlin()
  const in15 = new Date(today)
  in15.setDate(in15.getDate() + 15)

  const events = await prisma.event.findMany({
    where: {
      isDeleted: false,
      isActive: true,
      dates: {
        some: {
          date: { gte: today, lte: in15 },
        },
      },
    },
    include: {
      dates: {
        where: { date: { gte: today, lte: in15 } },
        orderBy: { date: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Ordenar por fecha más próxima
  const sorted = events
    .filter((e) => e.dates.length > 0)
    .sort((a, b) => {
      const da = a.dates[0]!.date.getTime()
      const db = b.dates[0]!.date.getTime()
      return da - db
    })

  if (sorted.length === 0) {
    console.log("newsletter_digest_skipped", { reason: "no_events" })
    return NextResponse.json({ data: { sent: false, reason: "no_events" } })
  }

  const hasMore = sorted.length > MAX_EVENTS
  const toSend = sorted.slice(0, MAX_EVENTS)

  const digestEvents: DigestEvent[] = toSend.map((e) => ({
    title: e.title,
    slug: e.slug,
    nextDate: e.dates[0]!.date.toISOString(),
    location: e.location ?? "",
    coverImage: e.coverImage ?? null,
  }))

  const appUrl = env.NEXT_PUBLIC_APP_URL
  const resend = getResend()
  const result: Record<string, number> = {}

  // 2. Por cada idioma → obtener suscriptores y enviar
  for (const lang of LANGUAGES) {
    const segmentId = segmentIdForLang(lang)
    if (!segmentId) continue

    let subscriberEmails: string[] = []
    try {
      const { data: list } = await resend.contacts.list({ segmentId })
      subscriberEmails = (list?.data ?? [])
        .filter((c) => !c.unsubscribed)
        .map((c) => c.email)
    } catch (err) {
      console.error(`newsletter_digest_list_failed_${lang}`, {
        errorName: err instanceof Error ? err.name : typeof err,
      })
      continue
    }

    if (subscriberEmails.length === 0) {
      result[lang] = 0
      continue
    }

    const { subject, html } = buildDigestEmail(lang, digestEvents, hasMore, appUrl)

    // Resend permite hasta 50 destinatarios por envío
    const BATCH = 50
    let sent = 0
    for (let i = 0; i < subscriberEmails.length; i += BATCH) {
      const batch = subscriberEmails.slice(i, i + BATCH)
      try {
        await resend.emails.send({
          from: "La Huella del Caminante <noreply@lahuelladelcaminante.de>",
          to: batch,
          subject,
          html,
        })
        sent += batch.length
      } catch (err) {
        console.error(`newsletter_digest_send_failed_${lang}`, {
          errorName: err instanceof Error ? err.name : typeof err,
          batch: i,
        })
      }
    }
    result[lang] = sent
  }

  console.log("newsletter_digest_sent", { result, events: sorted.length })
  return NextResponse.json({ data: { sent: true, result, events: sorted.length } })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/newsletter/digest/route.ts
git commit -S -m "feat(newsletter): POST /api/newsletter/digest — cron semanal"
```

---

## Task 8: i18n — claves nuevas

**Files:**
- Modify: `src/messages/es.json`
- Modify: `src/messages/en.json`
- Modify: `src/messages/de.json`

- [ ] **Step 1: Agregar namespace `newsletter` a `es.json`**

Agregar al final del objeto JSON (antes del `}`):

```json
"newsletter": {
  "pageTitle": "Newsletter",
  "pageDescription": "Suscribite para recibir cada semana los eventos latinos que se vienen en Berlín.",
  "formEmailPlaceholder": "tu@email.com",
  "formSubmit": "Suscribirme",
  "formConsent": "Acepto recibir el newsletter semanal de La Huella del Caminante. Puedo darme de baja en cualquier momento.",
  "formConsentLink": "Política de privacidad",
  "successMessage": "¡Listo! Revisá tu email para confirmar la suscripción.",
  "errorMessage": "Algo salió mal. Intentá de nuevo.",
  "confirmedBanner": "¡Suscripción confirmada! A partir del próximo lunes vas a recibir los eventos de la semana.",
  "tokenExpiredMessage": "El link de confirmación expiró. Volvé a suscribirte para recibir un nuevo email.",
  "footerLabel": "Newsletter semanal"
}
```

- [ ] **Step 2: Agregar namespace `newsletter` a `en.json`**

```json
"newsletter": {
  "pageTitle": "Newsletter",
  "pageDescription": "Subscribe to receive the upcoming Latin events in Berlin every week.",
  "formEmailPlaceholder": "your@email.com",
  "formSubmit": "Subscribe",
  "formConsent": "I agree to receive the weekly newsletter from La Huella del Caminante. I can unsubscribe at any time.",
  "formConsentLink": "Privacy policy",
  "successMessage": "Done! Check your email to confirm your subscription.",
  "errorMessage": "Something went wrong. Please try again.",
  "confirmedBanner": "Subscription confirmed! Starting next Monday you'll receive the week's events.",
  "tokenExpiredMessage": "The confirmation link has expired. Subscribe again to receive a new email.",
  "footerLabel": "Weekly newsletter"
}
```

- [ ] **Step 3: Agregar namespace `newsletter` a `de.json`**

```json
"newsletter": {
  "pageTitle": "Newsletter",
  "pageDescription": "Abonniere und erhalte jede Woche die kommenden lateinamerikanischen Events in Berlin.",
  "formEmailPlaceholder": "deine@email.com",
  "formSubmit": "Anmelden",
  "formConsent": "Ich stimme zu, den wöchentlichen Newsletter von La Huella del Caminante zu erhalten. Ich kann mich jederzeit abmelden.",
  "formConsentLink": "Datenschutzerklärung",
  "successMessage": "Fertig! Prüfe deine E-Mails, um das Abonnement zu bestätigen.",
  "errorMessage": "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
  "confirmedBanner": "Abonnement bestätigt! Ab dem nächsten Montag erhältst du die Events der Woche.",
  "tokenExpiredMessage": "Der Bestätigungslink ist abgelaufen. Melde dich erneut an, um eine neue E-Mail zu erhalten.",
  "footerLabel": "Wöchentlicher Newsletter"
}
```

- [ ] **Step 4: Commit**

```bash
git add src/messages/es.json src/messages/en.json src/messages/de.json
git commit -S -m "feat(newsletter): i18n keys ES/EN/DE"
```

---

## Task 9: NewsletterForm client component

**Files:**
- Create: `src/components/newsletter/NewsletterForm.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
"use client"

/**
 * NewsletterForm — form de suscripción reutilizable.
 *
 * Variantes:
 *  - `footer`: compacto, inline. Sin checkbox de consentimiento (implícito).
 *  - `page`: con más espacio + checkbox GDPR obligatorio.
 *
 * El idioma viene del locale activo y se manda como campo hidden.
 * El `website` es un honeypot (hidden via CSS, no `display:none`).
 */

import { useState, useTransition } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { newsletterSchema } from "@/lib/validators/newsletter"

type FormState = "idle" | "loading" | "success" | "error"

interface NewsletterFormProps {
  variant: "footer" | "page"
  /** Estado inicial de la página: confirmed=true o error=token_expired|invalid_token */
  initialState?: "confirmed" | "token_expired" | null
}

export default function NewsletterForm({ variant, initialState }: NewsletterFormProps) {
  const t = useTranslations("newsletter")
  const locale = useLocale()
  const [email, setEmail] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<FormState>("idle")
  const [isPending, startTransition] = useTransition()

  const isLoading = state === "loading" || isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validación cliente
    const parsed = newsletterSchema.safeParse({ email, language: locale })
    if (!parsed.success) {
      setState("error")
      return
    }

    // Consent requerido en variante page
    if (variant === "page" && !consent) return

    startTransition(() => setState("loading"))

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ email, language: locale, website: honeypot }),
      })

      if (!res.ok) {
        setState("error")
        return
      }

      setState("success")
    } catch {
      setState("error")
    }
  }

  if (state === "success") {
    return (
      <p className={cn(
        "text-fg-secondary",
        variant === "footer" ? "text-body-s" : "text-body"
      )}>
        {t("successMessage")}
      </p>
    )
  }

  if (initialState === "confirmed") {
    return (
      <p className={cn(
        "text-brand font-medium",
        variant === "footer" ? "text-body-s" : "text-body"
      )}>
        {t("confirmedBanner")}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn(
      "flex flex-col",
      variant === "footer" ? "gap-s" : "gap-m"
    )}>
      {/* Token expirado */}
      {initialState === "token_expired" && (
        <p className="text-body-s text-fg-secondary">{t("tokenExpiredMessage")}</p>
      )}

      {/* Honeypot — hidden via CSS */}
      <div style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden>
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className={cn(
        "flex",
        variant === "footer" ? "flex-row gap-xs" : "flex-col gap-s"
      )}>
        <input
          type="email"
          required
          placeholder={t("formEmailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className={cn(
            "bg-bg-subtle border border-border rounded-m text-body text-fg-primary placeholder:text-fg-tertiary",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-bg-page",
            "disabled:opacity-50",
            variant === "footer"
              ? "px-s py-xs text-body-s flex-1 min-w-0"
              : "px-m py-s w-full"
          )}
        />
        <button
          type="submit"
          disabled={isLoading || (variant === "page" && !consent)}
          className={cn(
            "bg-brand text-on-brand font-semibold rounded-m transition-opacity",
            "hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
            variant === "footer"
              ? "px-m py-xs text-body-s shrink-0"
              : "px-l py-s text-body w-full"
          )}
        >
          {isLoading ? "…" : t("formSubmit")}
        </button>
      </div>

      {/* Checkbox GDPR — solo en variante page */}
      {variant === "page" && (
        <label className="flex items-start gap-s cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-[3px] shrink-0 accent-brand"
          />
          <span className="text-body-s text-fg-secondary leading-relaxed">
            {t("formConsent")}{" "}
            <Link href="/datenschutz" className="underline hover:text-fg-primary transition-colors">
              {t("formConsentLink")}
            </Link>
          </span>
        </label>
      )}

      {state === "error" && (
        <p className="text-body-s text-fg-secondary">{t("errorMessage")}</p>
      )}
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/newsletter/NewsletterForm.tsx
git commit -S -m "feat(newsletter): NewsletterForm component — footer + page variants"
```

---

## Task 10: Página `/newsletter`

**Files:**
- Create: `src/app/[locale]/(public)/newsletter/page.tsx`

- [ ] **Step 1: Crear el archivo**

```tsx
/**
 * `/newsletter` — página pública de suscripción al newsletter.
 *
 * Muestra el formulario con contexto (qué es, cuándo llega) y maneja
 * los estados post-confirmación via searchParams:
 *  - ?confirmed=true → banner de éxito
 *  - ?error=token_expired → mensaje de link expirado
 *  - ?error=invalid_token → mensaje de link inválido
 */

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Eyebrow from "@/components/ui/Eyebrow"
import NewsletterForm from "@/components/newsletter/NewsletterForm"

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ confirmed?: string; error?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "newsletter" })
  return { title: t("pageTitle") }
}

export default async function NewsletterPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: "newsletter" })

  const initialState =
    sp.confirmed === "true"
      ? "confirmed"
      : sp.error === "token_expired"
        ? "token_expired"
        : null

  return (
    <div className="max-w-7xl mx-auto px-m sm:px-l py-l lg:py-xl">
      <div className="max-w-lg">
        <div className="flex flex-col gap-l">
          <div className="flex flex-col gap-s">
            <Eyebrow as="p">Newsletter</Eyebrow>
            <h1 className="text-heading-l sm:text-display-m font-display text-fg-primary leading-tight">
              {t("pageTitle")}
            </h1>
            <p className="text-body text-fg-secondary leading-relaxed">
              {t("pageDescription")}
            </p>
          </div>
          <NewsletterForm variant="page" initialState={initialState} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\[locale\]/\(public\)/newsletter/page.tsx
git commit -S -m "feat(newsletter): página /newsletter con form + estados confirmed/expired"
```

---

## Task 11: Footer — reemplazar placeholder

**Files:**
- Modify: `src/components/layout/Footer.tsx`

- [ ] **Step 1: Modificar el Footer**

El Footer es un server component. Necesita pasar el locale al `NewsletterForm`. Importar `getLocale` de `next-intl/server` y `NewsletterForm`.

Agregar imports al inicio del archivo:
```ts
import { getLocale } from "next-intl/server"
import NewsletterForm from "@/components/newsletter/NewsletterForm"
```

En la función `Footer`, obtener el locale:
```ts
export async function Footer() {
  const t = await getTranslations("footer")
  const tNav = await getTranslations("nav")
  const locale = await getLocale()   // ← AGREGAR
  const year = new Date().getFullYear()
```

Reemplazar el bloque del link placeholder (columna COMUNIDAD):

```tsx
{/* ANTES: */}
{/* TODO: replace `#` with real newsletter signup once flow exists. */}
<FooterLink href="#" external>
  {t("newsletter")}
</FooterLink>

{/* DESPUÉS: */}
<li>
  <NewsletterForm variant="footer" />
</li>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -S -m "feat(newsletter): footer — reemplaza placeholder con NewsletterForm"
```

---

## Task 12: Cron en VPS

**Files:**
- No hay archivos de código — es configuración del VPS.

- [ ] **Step 1: Agregar la var de entorno al VPS**

En el VPS, agregar al archivo de entorno (`.env.local` o el mecanismo que usa PM2):
```
DIGEST_CRON_SECRET=<string-aleatorio-32-chars>
RESEND_SEGMENT_ID_ES=<id-del-dashboard-resend>
RESEND_SEGMENT_ID_EN=<id-del-dashboard-resend>
RESEND_SEGMENT_ID_DE=<id-del-dashboard-resend>
NEWSLETTER_JWT_SECRET=<string-aleatorio-32-chars>
```

- [ ] **Step 2: Agregar entrada al crontab del VPS**

```bash
# En el VPS:
crontab -e
```

Agregar línea:
```cron
0 8 * * 1 curl -s -X POST https://lahuelladelcaminante.de/api/newsletter/digest -H "Authorization: Bearer TU_DIGEST_CRON_SECRET" >> /var/log/newsletter-digest.log 2>&1
```

- [ ] **Step 3: Verificar cron funcionando**

Testear el endpoint manualmente desde local:
```bash
curl -X POST https://lahuelladelcaminante.de/api/newsletter/digest \
  -H "Authorization: Bearer TU_DIGEST_CRON_SECRET"
# Esperar: {"data":{"sent":false,"reason":"no_events"}} si no hay eventos
# O: {"data":{"sent":true,"result":{"es":N,"en":N,"de":N},"events":M}}
```

- [ ] **Step 4: Hacer deploy**

```bash
bash deploy.sh
```

---

## Self-review checklist

- [x] Doble opt-in → Task 5 (subscribe crea contacto unsubscribed=true) + Task 6 (confirm lo activa)
- [x] JWT 24h → Task 3 (`signNewsletterToken` con exp 24h)
- [x] Idioma detectado del locale → Task 9 (`useLocale()`) y Task 5 (`x-locale` header → campo `language`)
- [x] 3 idiomas ES/EN/DE → Task 4 (STRINGS object), Task 8 (i18n)
- [x] Footer inline → Task 11
- [x] Página /newsletter → Task 10
- [x] Anti-abuse → Task 5 (origin check + rate limit + honeypot)
- [x] Digest semanal → Task 7 (API route protegido) + Task 12 (VPS cron)
- [x] Skip si 0 eventos → Task 7 (`if (sorted.length === 0)`)
- [x] Máx 5 eventos → Task 7 (`MAX_EVENTS = 5`)
- [x] Unsubscribe → Task 4 (`{{{RESEND_UNSUBSCRIBE_URL}}}` en digest template)
- [x] Resend v6 segments (no audiences deprecadas) → Tasks 5, 6, 7
- [x] Email ya suscripto → Task 5 (early return si `!existing.unsubscribed`)
- [x] Token expirado → Task 6 (JWTExpired → redirect token_expired) + Task 10 (render mensaje)
