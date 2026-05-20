import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  TRIGGER_SECRET_KEY: z.string().optional().default(""),
  /**
   * Email del founder al que llegan los mensajes de `/contact`. Si no
   * está definida, el handler cae a `info@lahuelladelcaminante.de`
   * (mismo destino histórico de `triggerApplicationNotification`).
   */
  CONTACT_RECIPIENT_EMAIL: z
    .string()
    .email()
    .optional()
    .default("info@lahuelladelcaminante.de"),
  /**
   * Email interno del equipo al que llegan las notificaciones del
   * sistema: nuevas applications de creator (`/apply`) y nuevos signups.
   * Separado a propósito de `CONTACT_RECIPIENT_EMAIL` (mensajes públicos
   * de `/contact`) para poder rutear, a futuro, las notificaciones
   * internas y los mensajes de contacto a inboxes distintas sin tocar
   * código. Si no está definida, cae a `info@lahuelladelcaminante.de`.
   */
  ADMIN_NOTIFICATION_EMAIL: z
    .string()
    .email()
    .optional()
    .default("info@lahuelladelcaminante.de"),
})

export const env = envSchema.parse(process.env)
