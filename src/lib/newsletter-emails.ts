/**
 * Builders de HTML para los emails del newsletter.
 *
 * NO usa next-intl (los emails se generan fuera del contexto de request).
 * Contenido hardcodeado en ES/EN/DE, mismo patrón que src/lib/trigger.ts.
 *
 * Dos templates:
 *  - buildConfirmationEmail(lang, confirmUrl) → email de doble opt-in
 *  - buildDigestEmail(lang, events, hasMore, appUrl) → digest semanal
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

function emailWrapper(content: string, lang: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
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

  return { subject: s.confirmSubject, html: emailWrapper(body, getLang(lang)) }
}

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

  return { subject: s.digestSubject, html: emailWrapper(body, l) }
}
