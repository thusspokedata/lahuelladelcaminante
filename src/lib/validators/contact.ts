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

/**
 * Strip de caracteres invisibles que pueden facilitar abuse:
 *  - `U+200B-U+200F`: zero-width chars + direccional marks (LRM/RLM).
 *  - `U+202A-U+202E`: overrides de direccionalidad (RLO, LRO, etc).
 *    Sin esto, un nombre malicioso con RLO puede renderizarse invertido
 *    en la inbox del founder y facilitar phishing visual.
 *  - `U+2060-U+2069`: word joiner + invisible operators / formatting.
 *
 * Newlines/tabs (`\n`, `\r`, `\t`) se PRESERVAN porque el `message`
 * legítimamente tiene saltos de línea. El subject del email aplica su
 * propio `.replace(/[\r\n]+/g, " ")` para CRLF en headers.
 */
function stripInvisibleAbusableChars(value: string): string {
  return value.replace(/[​-‏‪-‮⁠-⁩]/g, "")
}

/** Normalize Unicode (NFKC: combina equivalentes y desambigua compatibles)
 * para evitar homoglyphs que crucen el form vía caracteres equivalentes. */
function normalizeAndStrip(value: string): string {
  return stripInvisibleAbusableChars(value.normalize("NFKC"))
}

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .transform(normalizeAndStrip)
    .pipe(
      z
        .string()
        .min(2, { message: "name_too_short" })
        .max(120, { message: "name_too_long" })
    ),
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
    .transform(normalizeAndStrip)
    .pipe(
      z
        .string()
        .min(10, { message: "message_too_short" })
        .max(2000, { message: "message_too_long" })
    ),
  /**
   * Honeypot — campo invisible (CSS `display:none`) que un humano nunca
   * llena pero los bots de spam clásicos sí. Si llega no-vacío, el
   * server descarta silenciosamente el request con un 200 fake (no le
   * damos pista al bot de que detectamos el honeypot — si rebota 4xx,
   * el atacante ajusta el bot).
   *
   * Opcional en el schema (puede no estar presente en el payload) pero
   * si está, debe estar vacío para pasar el check del server.
   */
  website: z.string().optional(),
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
