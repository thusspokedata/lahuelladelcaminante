import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
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
})

export const env = envSchema.parse(process.env)
