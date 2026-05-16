/**
 * Schemas zod del form de contacto (`/contact`). Hay dos:
 *
 *  - `contactSchema`: el contrato user-facing. Lo usa el cliente para
 *    validar antes del submit y para tipar el estado del form. NO
 *    incluye el honeypot — los bots que inspeccionan el bundle del
 *    cliente no encuentran pista de que existe.
 *  - `contactRequestSchema`: extiende `contactSchema` agregando el
 *    campo honeypot `website`. Es el schema que aplica el server al
 *    re-validar el payload entrante. Si `website` viene no-vacío, el
 *    handler descarta silenciosamente (200 fake, sin pista al bot).
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

/** Schema user-facing — sin honeypot. Consumido por el cliente para
 * validación + tipado del state del form. El bundle del cliente NO
 * expone que existe un honeypot. */
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
})

export type ContactInput = z.infer<typeof contactSchema>

/**
 * Schema server-side — extiende `contactSchema` con el honeypot
 * `website`. Si llega no-vacío, el handler descarta silenciosamente
 * (200 fake, sin pista al bot para que no ajuste su estrategia).
 *
 * Opcional en el schema (puede no estar presente en el payload — un
 * cliente legítimo no manda el campo) pero si está, no debe contener
 * data. El handler aplica la verificación de "no-vacío" sobre el
 * resultado del parse.
 */
export const contactRequestSchema = contactSchema.extend({
  website: z.string().optional(),
})

export type ContactRequest = z.infer<typeof contactRequestSchema>

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
