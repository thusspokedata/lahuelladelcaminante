/**
 * Schemas Zod del form de suscripción al newsletter.
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
