async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return
  const { getResend } = await import("./email")
  await getResend().emails.send({
    from: "noreply@lahuelladelcaminante.com",
    to,
    subject,
    html,
  })
}

export async function triggerWelcomeEmail(payload: { email: string; name: string }) {
  await sendEmail(
    payload.email,
    "Tu cuenta está en revisión",
    `<p>Hola ${payload.name}, tu cuenta está siendo revisada. Te avisaremos cuando sea aprobada.</p>`
  )
}

export async function triggerAccountApproved(payload: { email: string; name: string }) {
  await sendEmail(
    payload.email,
    "Tu cuenta fue aprobada",
    `<p>Hola ${payload.name}, ya puedes acceder a la plataforma.</p>`
  )
}

export async function triggerAccountBlocked(payload: { email: string; name: string }) {
  await sendEmail(
    payload.email,
    "Tu cuenta ha sido suspendida",
    `<p>Hola ${payload.name}, tu cuenta ha sido suspendida. Contacta al administrador.</p>`
  )
}
