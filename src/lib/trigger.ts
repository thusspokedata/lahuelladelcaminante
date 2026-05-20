import { createTranslator } from "next-intl"
import { env } from "./env"

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options: { replyTo?: string } = {}
) {
  if (!process.env.RESEND_API_KEY) return
  const { getResend } = await import("./email")
  await getResend().emails.send({
    from: "La Huella del Caminante <noreply@lahuelladelcaminante.de>",
    to,
    subject,
    html,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  })
}

export async function triggerWelcomeEmail(payload: { email: string; name: string }) {
  await sendEmail(
    payload.email,
    "Tu cuenta está en revisión — La Huella del Caminante",
    `<p>Hola ${payload.name}, tu cuenta está siendo revisada. Te avisaremos cuando sea aprobada.</p>`
  )
}

export async function triggerAccountApproved(payload: { email: string; name: string }) {
  await sendEmail(
    payload.email,
    "Tu cuenta fue aprobada — La Huella del Caminante",
    `<p>Hola ${payload.name}, ya puedes acceder a la plataforma.</p>`
  )
}

export async function triggerAccountBlocked(payload: { email: string; name: string }) {
  await sendEmail(
    payload.email,
    "Tu cuenta ha sido suspendida — La Huella del Caminante",
    `<p>Hola ${payload.name}, tu cuenta ha sido suspendida. Contacta al administrador.</p>`
  )
}

// Sent to the applicant when their application is approved (before they register)
export async function triggerApplicationApproved(payload: { email: string; name: string }) {
  const registerUrl = "https://lahuelladelcaminante.de/es/sign-up"
  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0407;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#130609;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">

        <tr><td style="background:linear-gradient(135deg,#7a1a0e 0%,#c0392b 50%,#7a1a0e 100%);padding:40px 32px;text-align:center">
          <p style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px">La Huella del Caminante</p>
          <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin:0;line-height:1.2">¡Tu solicitud<br>fue aprobada!</h1>
        </td></tr>

        <tr><td style="padding:36px 32px">
          <p style="color:#e8d5d0;font-size:16px;margin:0 0 20px;line-height:1.6">
            Hola <strong style="color:#ffffff">${payload.name}</strong>,
          </p>
          <p style="color:#c4a9a4;font-size:15px;margin:0 0 28px;line-height:1.7">
            Revisamos tu solicitud y quedaste aprobado/a para publicar eventos en
            <strong style="color:#c0392b">La Huella del Caminante</strong>.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;border-radius:10px;padding:20px 24px;margin:0 0 28px">
            <tr><td>
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 14px">Cómo empezar</p>
              <p style="color:#c4a9a4;font-size:14px;margin:0 0 10px;line-height:1.6">
                <span style="color:#c0392b;font-weight:700">1.</span> Creá tu cuenta con este email: <strong style="color:#ffffff">${payload.email}</strong>
              </p>
              <p style="color:#c4a9a4;font-size:14px;margin:0 0 10px;line-height:1.6">
                <span style="color:#c0392b;font-weight:700">2.</span> Tu cuenta se activará automáticamente como artista
              </p>
              <p style="color:#c4a9a4;font-size:14px;margin:0;line-height:1.6">
                <span style="color:#c0392b;font-weight:700">3.</span> Publicá tus eventos con fechas, lugar y fotos
              </p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px">
            <tr><td align="center">
              <a href="${registerUrl}"
                 style="display:inline-block;background:#c0392b;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:50px;letter-spacing:0.02em">
                Crear mi cuenta →
              </a>
            </td></tr>
          </table>

          <p style="color:rgba(255,255,255,0.35);font-size:13px;margin:0;line-height:1.6">
            ¿Alguna pregunta? Escribinos a
            <a href="mailto:info@lahuelladelcaminante.de" style="color:#c0392b;text-decoration:none">info@lahuelladelcaminante.de</a>
          </p>
        </td></tr>

        <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:20px 32px;text-align:center">
          <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0">
            © ${new Date().getFullYear()} La Huella del Caminante · Berlín
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await sendEmail(
    payload.email,
    "¡Tu solicitud fue aprobada! — La Huella del Caminante",
    html
  )
}

// Sent to the artist when an admin promotes them to role=artist
export async function triggerArtistWelcome(payload: { email: string; name: string }) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0407;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#130609;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">

        <tr><td style="background:linear-gradient(135deg,#7a1a0e 0%,#c0392b 50%,#7a1a0e 100%);padding:40px 32px;text-align:center">
          <p style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px">La Huella del Caminante</p>
          <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin:0;line-height:1.2">¡Ya podés publicar<br>tus eventos!</h1>
        </td></tr>

        <tr><td style="padding:36px 32px">
          <p style="color:#e8d5d0;font-size:16px;margin:0 0 20px;line-height:1.6">
            Hola <strong style="color:#ffffff">${payload.name}</strong>,
          </p>
          <p style="color:#c4a9a4;font-size:15px;margin:0 0 28px;line-height:1.7">
            Tu solicitud fue aprobada. Ya tenés acceso como artista en
            <strong style="color:#c0392b">La Huella del Caminante</strong> —
            la escena musical latinoamericana en Alemania.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0">
            <tr><td align="center">
              <a href="https://lahuelladelcaminante.de/es/dashboard/events/create"
                 style="display:inline-block;background:#c0392b;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:50px;letter-spacing:0.02em">
                Publicar mi primer evento →
              </a>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;border-radius:10px;padding:20px 24px;margin:8px 0 28px">
            <tr><td>
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 14px">Cómo empezar</p>
              <p style="color:#c4a9a4;font-size:14px;margin:0 0 10px;line-height:1.6">
                <span style="color:#c0392b;font-weight:700">1.</span> Ingresá con tu cuenta en <a href="https://lahuelladelcaminante.de" style="color:#c0392b;text-decoration:none">lahuelladelcaminante.de</a>
              </p>
              <p style="color:#c4a9a4;font-size:14px;margin:0 0 10px;line-height:1.6">
                <span style="color:#c0392b;font-weight:700">2.</span> Desde el panel, creá tu perfil de artista
              </p>
              <p style="color:#c4a9a4;font-size:14px;margin:0;line-height:1.6">
                <span style="color:#c0392b;font-weight:700">3.</span> Publicá tus eventos con fechas, lugar y fotos
              </p>
            </td></tr>
          </table>

          <p style="color:rgba(255,255,255,0.35);font-size:13px;margin:0;line-height:1.6">
            ¿Alguna pregunta? Escribinos a
            <a href="mailto:info@lahuelladelcaminante.de" style="color:#c0392b;text-decoration:none">info@lahuelladelcaminante.de</a>
          </p>
        </td></tr>

        <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:20px 32px;text-align:center">
          <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0">
            © ${new Date().getFullYear()} La Huella del Caminante · Berlín
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await sendEmail(
    payload.email,
    "¡Ya podés publicar tus eventos en La Huella del Caminante!",
    html
  )
}

// Sent to admin when someone submits an apply form
export async function triggerApplicationNotification(payload: {
  name: string
  email: string
  message: string
}) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0407;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#130609;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">

        <tr><td style="background:#1a0c10;padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 6px">La Huella del Caminante</p>
          <h1 style="color:#ffffff;font-size:20px;font-weight:800;margin:0">Nueva solicitud de publicación</h1>
        </td></tr>

        <tr><td style="padding:32px">
          <p style="color:#c4a9a4;font-size:14px;margin:0 0 24px">
            Alguien quiere publicar eventos en la plataforma:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;border-radius:10px;overflow:hidden">
            <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px">Nombre</p>
              <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0">${payload.name}</p>
            </td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px">Email</p>
              <p style="color:#c0392b;font-size:15px;font-weight:600;margin:0">
                <a href="mailto:${payload.email}" style="color:#c0392b;text-decoration:none">${payload.email}</a>
              </p>
            </td></tr>
            <tr><td style="padding:14px 20px">
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px">Mensaje</p>
              <p style="color:#e8d5d0;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap">${payload.message}</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0">
            <tr><td align="center">
              <!-- Apunta a /admin/applications (no /admin/users): aprobar la
                   solicitud ahí sube el rol a creator y notifica a la
                   persona. Cambiar el rol a mano en /admin/users no hace
                   ninguna de esas dos cosas. -->
              <a href="https://lahuelladelcaminante.de/es/admin/applications"
                 style="display:inline-block;background:#c0392b;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:50px">
                Revisar solicitud →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:18px 32px;text-align:center">
          <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0">
            © ${new Date().getFullYear()} La Huella del Caminante · Berlín
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await sendEmail(
    env.ADMIN_NOTIFICATION_EMAIL,
    `Nueva solicitud: ${payload.name} quiere publicar eventos`,
    html
  )
}

// Locales soportados para el email de bienvenida. El copy de los 3 vive
// en `src/messages/{es,en,de}.json` bajo `emails.welcomeUser`. Debe
// mantenerse en sincronía con `routing.locales` (`src/i18n/routing.ts`):
// si se agrega un idioma al sitio, sumarlo acá y al `switch` de
// `loadEmailMessages`.
const EMAIL_LOCALES = ["es", "en", "de"] as const
type EmailLocale = (typeof EMAIL_LOCALES)[number]

/** Normaliza un locale arbitrario al set soportado. Fallback: `es`
 * (default del sitio) — decisión cerrada del spec. */
function normalizeEmailLocale(locale: string): EmailLocale {
  return (EMAIL_LOCALES as readonly string[]).includes(locale)
    ? (locale as EmailLocale)
    : "es"
}

/** Etiqueta legible del idioma para el email interno al admin. */
const LOCALE_LABEL: Record<EmailLocale, string> = {
  es: "Español",
  en: "English",
  de: "Deutsch",
}

/**
 * Carga el JSON de mensajes de un locale. Import dinámico con string
 * estático (un chunk por idioma) — mismo enfoque que `src/i18n/request.ts`.
 * El `createTranslator` de next-intl resuelve el copy sin depender de un
 * request scope, así que sirve dentro del hook de Better Auth.
 */
async function loadEmailMessages(locale: EmailLocale) {
  switch (locale) {
    case "en":
      return (await import("../messages/en.json")).default
    case "de":
      return (await import("../messages/de.json")).default
    default:
      return (await import("../messages/es.json")).default
  }
}

/**
 * Email de bienvenida al usuario que acaba de registrarse. Se envía en
 * el idioma que tenía activo en el sitio al momento del signup (ES/EN/DE,
 * fallback ES). Tono editorial y corto.
 *
 * IMPORTANTE: el signup es inmediato — la cuenta nace activa. Este email
 * NO promete "revisión en 1-2 días" (eso es solo para el flujo creator
 * de `/apply`). La mención del camino creator es informativa, no un CTA
 * que presione.
 */
export async function triggerSignupWelcome(payload: {
  email: string
  name: string
  locale: string
}) {
  const locale = normalizeEmailLocale(payload.locale)
  const messages = await loadEmailMessages(locale)
  const t = createTranslator({
    locale,
    messages,
    namespace: "emails.welcomeUser",
  })

  const safeName = payload.name.trim()
  // El nombre es lo único interpolado de fuente no controlada. Se escapa
  // e interpola directo en el template literal del HTML — igual que en
  // `triggerSignupAdminNotification` y `triggerContactNotification` — en
  // vez de pasarlo por `t()`. Así el escape es una sola capa explícita,
  // sin depender de cómo trate `createTranslator` los valores ICU. La
  // key `greeting` es solo la palabra ("Hola"/"Hi"/"Hallo").
  const greeting = safeName
    ? `${t("greeting")} ${escapeHtml(safeName)},`
    : `${t("greeting")},`
  const eventsUrl = `https://lahuelladelcaminante.de/${locale}/events`
  const applyUrl = `https://lahuelladelcaminante.de/${locale}/apply`

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0407;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#130609;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">

        <tr><td style="background:linear-gradient(135deg,#7a1a0e 0%,#c0392b 50%,#7a1a0e 100%);padding:40px 32px;text-align:center">
          <p style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px">La Huella del Caminante</p>
          <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin:0;line-height:1.2">${t("heading")}</h1>
        </td></tr>

        <tr><td style="padding:36px 32px">
          <p style="color:#e8d5d0;font-size:16px;margin:0 0 20px;line-height:1.6">${greeting}</p>
          <p style="color:#c4a9a4;font-size:15px;margin:0 0 16px;line-height:1.7">${t("intro")}</p>
          <p style="color:#c4a9a4;font-size:15px;margin:0 0 28px;line-height:1.7">${t("body")}</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px">
            <tr><td align="center">
              <a href="${eventsUrl}"
                 style="display:inline-block;background:#c0392b;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:50px;letter-spacing:0.02em">
                ${t("exploreCta")} →
              </a>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;border-radius:10px;padding:20px 24px">
            <tr><td>
              <p style="color:#c4a9a4;font-size:14px;margin:0 0 10px;line-height:1.6">${t("creatorNudge")}</p>
              <p style="margin:0">
                <a href="${applyUrl}" style="color:#c0392b;font-size:14px;font-weight:700;text-decoration:none">${t("creatorCta")} →</a>
              </p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:20px 32px;text-align:center">
          <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0">
            © ${new Date().getFullYear()} La Huella del Caminante · Berlín
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await sendEmail(payload.email, t("subject"), html)
}

/**
 * Email interno al admin avisando que hubo un signup nuevo. Uno por cada
 * registro (decisión del spec — sin agrupamiento). Siempre en castellano
 * (lo lee el founder). Destinatario: `env.ADMIN_NOTIFICATION_EMAIL`.
 *
 * Solo incluye lo necesario para que el admin sepa que hubo un alta:
 * nombre, email, idioma usado y fecha. Sin datos sensibles extra.
 */
export async function triggerSignupAdminNotification(payload: {
  email: string
  name: string
  locale: string
  createdAt: Date
}) {
  const locale = normalizeEmailLocale(payload.locale)
  // Defensa en profundidad: colapsar CRLF antes de que `name` o `email`
  // toquen el `Subject:` MIME header (mismo tratamiento que
  // `triggerContactNotification`). El email se usa como fallback del
  // subject cuando no hay nombre — Better Auth ya valida su formato,
  // pero lo saneamos igual por consistencia con `safeSubjectName`.
  const safeSubjectName = payload.name
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 100)
  const safeSubjectEmail = payload.email
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 120)
  const fecha = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(payload.createdAt)

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0407;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#130609;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">

        <tr><td style="background:#1a0c10;padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 6px">La Huella del Caminante</p>
          <h1 style="color:#ffffff;font-size:20px;font-weight:800;margin:0">Nuevo registro en la plataforma</h1>
        </td></tr>

        <tr><td style="padding:32px">
          <p style="color:#c4a9a4;font-size:14px;margin:0 0 24px">
            Una persona creó una cuenta nueva:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;border-radius:10px;overflow:hidden">
            <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px">Nombre</p>
              <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0">${escapeHtml(payload.name)}</p>
            </td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px">Email</p>
              <p style="color:#c0392b;font-size:15px;font-weight:600;margin:0">
                <a href="mailto:${escapeHtml(payload.email)}" style="color:#c0392b;text-decoration:none">${escapeHtml(payload.email)}</a>
              </p>
            </td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px">Idioma</p>
              <p style="color:#e8d5d0;font-size:15px;margin:0">${LOCALE_LABEL[locale]} (${locale})</p>
            </td></tr>
            <tr><td style="padding:14px 20px">
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px">Fecha</p>
              <p style="color:#e8d5d0;font-size:15px;margin:0">${escapeHtml(fecha)}</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0">
            <tr><td align="center">
              <a href="https://lahuelladelcaminante.de/es/admin/users"
                 style="display:inline-block;background:#c0392b;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:50px">
                Gestionar usuarios →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:18px 32px;text-align:center">
          <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0">
            © ${new Date().getFullYear()} La Huella del Caminante · Berlín
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await sendEmail(
    env.ADMIN_NOTIFICATION_EMAIL,
    `Nuevo registro en La Huella: ${safeSubjectName || safeSubjectEmail}`,
    html
  )
}

/**
 * Email al founder con un mensaje del form de `/contact`. Subject
 * pre-clasificado para que sea fácil triage en la inbox:
 * `[Contacto · {typeLabel}] {nombre}`.
 *
 * - `to`: destinatario, resuelto por el caller desde
 *   `env.CONTACT_RECIPIENT_EMAIL` (fallback a `info@lahuelladelcaminante.de`).
 * - `typeLabel`: label legible del tipo (ej. "Prensa o medios") — el
 *   caller ya lo resolvió con i18n.
 * - `replyTo`: el email del remitente se setea como Reply-To para que
 *   responder desde la inbox vaya directo a la persona, sin tener que
 *   copiar el campo Email del cuerpo del mail.
 */
export async function triggerContactNotification(payload: {
  to: string
  name: string
  email: string
  type: string
  typeLabel: string
  message: string
  /** Locale del request que originó el mensaje. Setea `lang` del HTML
   * del email para que clientes de mail con corrección ortográfica/
   * traducción usen el idioma correcto. El header visible del email
   * sigue en castellano (lo lee el founder), pero el `lang` refleja la
   * realidad de quién escribió el contenido. */
  locale: string
}) {
  // Sanitización defensiva: zod ya valida `name` con `max(120)`, pero un
  // CRLF en el medio pasaría el length check y podría meterse en el
  // `Subject:` MIME header. Resend probablemente lo cubre, pero defendemos
  // en profundidad — colapsamos newlines a espacio y recortamos extra.
  const safeSubjectName = payload.name.replace(/[\r\n]+/g, " ").trim().slice(0, 100)
  const safeSubjectLabel = payload.typeLabel.replace(/[\r\n]+/g, " ").trim().slice(0, 60)
  // Mismo tratamiento para el email que va al `Reply-To` header y al
  // `<a href="mailto:">` del template. Zod `.email()` debería filtrar
  // CRLF, pero defense in depth: aún si una versión futura de zod o un
  // edge case lo deja pasar, no permitimos que llegue a un header MIME.
  // También cortamos `,` y `;` por si se intenta inyectar múltiples
  // destinatarios via Reply-To.
  const safeEmail = payload.email.replace(/[\r\n,;]+/g, "").trim()

  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(payload.locale)}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0407;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#130609;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">

        <tr><td style="background:#1a0c10;padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 6px">La Huella del Caminante</p>
          <h1 style="color:#ffffff;font-size:20px;font-weight:800;margin:0">Nuevo mensaje desde /contact</h1>
        </td></tr>

        <tr><td style="padding:32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0407;border-radius:10px;overflow:hidden">
            <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px">Tipo de consulta</p>
              <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0">${escapeHtml(payload.typeLabel)}</p>
            </td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px">Nombre</p>
              <p style="color:#ffffff;font-size:15px;font-weight:600;margin:0">${escapeHtml(payload.name)}</p>
            </td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06)">
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px">Email</p>
              <p style="color:#c0392b;font-size:15px;font-weight:600;margin:0">
                <a href="mailto:${escapeHtml(safeEmail)}" style="color:#c0392b;text-decoration:none">${escapeHtml(safeEmail)}</a>
              </p>
            </td></tr>
            <tr><td style="padding:14px 20px">
              <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px">Mensaje</p>
              <p style="color:#e8d5d0;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap">${escapeHtml(payload.message)}</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="border-top:1px solid rgba(255,255,255,0.06);padding:18px 32px;text-align:center">
          <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0">
            © ${new Date().getFullYear()} La Huella del Caminante · Berlín
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await sendEmail(
    payload.to,
    `[Contacto · ${safeSubjectLabel}] ${safeSubjectName}`,
    html,
    { replyTo: safeEmail }
  )
}

/** Escape mínimo para interpolar input del user en el HTML del email.
 * Suficiente para evitar HTML injection en una plantilla controlada
 * (no markdown ni script tags). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
