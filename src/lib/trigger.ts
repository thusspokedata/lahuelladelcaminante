import { task } from "@trigger.dev/sdk/v3"
import { resend } from "./email"

export const welcomeEmailTask = task({
  id: "welcome-email",
  run: async (payload: { email: string; name: string }) => {
    await resend.emails.send({
      from: "noreply@lahuelladelcaminante.com",
      to: payload.email,
      subject: "Tu cuenta está en revisión",
      html: `<p>Hola ${payload.name}, tu cuenta está siendo revisada. Te avisaremos cuando sea aprobada.</p>`,
    })
  },
})

export const accountApprovedTask = task({
  id: "account-approved-email",
  run: async (payload: { email: string; name: string }) => {
    await resend.emails.send({
      from: "noreply@lahuelladelcaminante.com",
      to: payload.email,
      subject: "Tu cuenta fue aprobada",
      html: `<p>Hola ${payload.name}, ya puedes acceder a la plataforma.</p>`,
    })
  },
})

export const accountBlockedTask = task({
  id: "account-blocked-email",
  run: async (payload: { email: string; name: string }) => {
    await resend.emails.send({
      from: "noreply@lahuelladelcaminante.com",
      to: payload.email,
      subject: "Tu cuenta ha sido suspendida",
      html: `<p>Hola ${payload.name}, tu cuenta ha sido suspendida. Contacta al administrador.</p>`,
    })
  },
})

export async function triggerWelcomeEmail(payload: { email: string; name: string }) {
  await welcomeEmailTask.trigger(payload)
}

export async function triggerAccountApproved(payload: { email: string; name: string }) {
  await accountApprovedTask.trigger(payload)
}

export async function triggerAccountBlocked(payload: { email: string; name: string }) {
  await accountBlockedTask.trigger(payload)
}
