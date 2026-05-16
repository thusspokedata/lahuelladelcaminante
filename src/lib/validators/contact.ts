/**
 * Schema zod compartido cliente/servidor para el form de contacto
 * (`/contact`). El cliente lo usa para validar antes del submit; el route
 * handler `/api/contact` lo re-aplica para no confiar en el cliente.
 *
 * Mantener un único `safeParse` en server es la línea anti-tampering;
 * la validación de cliente es solo UX (feedback inmediato).
 */

import { z } from "zod"

/** Tipos de consulta soportados por el dropdown. Estables — no traducir;
 * el componente que renderiza el `<select>` resuelve el label via i18n
 * por cada key. Estos valores viajan al server y aparecen en el subject
 * del email. */
export const CONTACT_TYPES = [
  "event_suggestion",
  "report_issue",
  "press",
  "partnership",
  "other",
] as const

export type ContactType = (typeof CONTACT_TYPES)[number]

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "name_too_short" })
    .max(120, { message: "name_too_long" }),
  email: z
    .string()
    .trim()
    .email({ message: "email_invalid" })
    .max(254, { message: "email_too_long" }),
  type: z.enum(CONTACT_TYPES, {
    message: "type_invalid",
  }),
  message: z
    .string()
    .trim()
    .min(10, { message: "message_too_short" })
    .max(2000, { message: "message_too_long" }),
})

export type ContactInput = z.infer<typeof contactSchema>

/**
 * Mapeo `ContactType` → key dentro del namespace i18n `contact.form.types`.
 * Vive acá (no en el client ni en el server) para que ambos consumidores
 * compartan la misma fuente y agregar un tipo nuevo fuerce actualizar
 * los dos lados (TS bloquea si falta una key).
 */
export const CONTACT_TYPE_I18N_KEY: Record<ContactType, string> = {
  event_suggestion: "eventSuggestion",
  report_issue: "reportIssue",
  press: "press",
  partnership: "partnership",
  other: "other",
}
