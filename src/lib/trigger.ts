async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return
  const { getResend } = await import("./email")
  await getResend().emails.send({
    from: "La Huella del Caminante <noreply@lahuelladelcaminante.de>",
    to,
    subject,
    html,
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
    "info@lahuelladelcaminante.de",
    `Nueva solicitud: ${payload.name} quiere publicar eventos`,
    html
  )
}
