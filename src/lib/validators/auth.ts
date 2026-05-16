/**
 * Schemas zod para los forms de auth (`/sign-in`, `/sign-up`).
 *
 * Consumidos por el cliente para validación + tipado del state del form.
 * Better Auth no usa estos schemas en el server — la validación server-side
 * la hace Better Auth con sus propios checks (email format, password
 * strength configurada en `auth.ts`, dedupe de email). Estos schemas son
 * UX-first: feedback inmediato en cliente con copy amigable i18n.
 *
 * Pattern de los `message` errors: en lugar de mensajes hardcoded en
 * castellano, los schemas devuelven keys (`email_invalid`, `password_too_short`,
 * etc.) que el form resuelve via `useTranslations("auth.signIn.errors")` /
 * `useTranslations("auth.signUp.errors")`. Mismo pattern que `contact.ts`
 * — mantiene la validación libre de idioma y permite agregar locales sin
 * tocar el schema.
 */

import { z } from "zod"

/** Mínimo de password — coincide con el setting `minPasswordLength: 8` de
 * Better Auth en `src/lib/auth.ts`. Si se cambia uno, hay que cambiar el
 * otro o el form rechaza un password que el server aceptaría (o viceversa). */
const PASSWORD_MIN = 8
const PASSWORD_MAX = 128

/** Límite de longitud de email — RFC 5321 §4.5.3.1.3 (254 chars total
 * para el local + domain). Mismo límite que `contact.ts`. */
const EMAIL_MAX = 254

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "email_required" })
    .email({ message: "email_invalid" })
    .max(EMAIL_MAX, { message: "email_too_long" }),
  password: z
    .string()
    .min(PASSWORD_MIN, { message: "password_too_short" })
    .max(PASSWORD_MAX, { message: "password_too_long" }),
})

export type SignInInput = z.infer<typeof signInSchema>

/**
 * Sign-up extiende sign-in con:
 *  - `name`: 2-120 chars, trim — mismo rango que `contact.ts` para consistencia.
 *  - `acceptTerms`: bool con refine `=== true`. Usar `boolean().refine`
 *    en vez de `z.literal(true)` mantiene la inferencia de tipo como
 *    `boolean` (RHF `defaultValues` necesita un valor sin cast falso),
 *    sin perder el mensaje i18n del error.
 */
export const signUpSchema = signInSchema.extend({
  name: z
    .string()
    .trim()
    .min(2, { message: "name_too_short" })
    .max(120, { message: "name_too_long" }),
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, { message: "terms_required" }),
})

export type SignUpInput = z.infer<typeof signUpSchema>
