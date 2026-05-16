"use client"

/**
 * ContactForm — form de `/contact`. Client component porque maneja
 * estado de submit + success state inline + reset.
 *
 * Validación: schema zod compartido (`@/lib/validators/contact`). En
 * cliente lo usamos para feedback inmediato antes del POST; el route
 * handler `/api/contact` re-aplica el mismo schema (no confiamos en
 * la validación del cliente). HTML `required` / `minLength` quedan
 * como red de seguridad — bloquean submit en browsers sin JS.
 *
 * UX:
 *  - Errores de validación de campo se muestran inline debajo del input.
 *  - Errores de network/server se muestran como `toast` (sonner).
 *  - Submit exitoso → render inline de la confirmación (no navega).
 *  - Botón "Enviar otro mensaje" en la confirmación → reset full del state.
 */

import { useState, useTransition } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Eyebrow from "@/components/ui/Eyebrow"
import {
  contactSchema,
  CONTACT_TYPES,
  CONTACT_TYPE_I18N_KEY,
  type ContactType,
  type ContactInput,
} from "@/lib/validators/contact"

type FieldErrors = Partial<Record<keyof ContactInput, string>>

const INITIAL_STATE: ContactInput = {
  name: "",
  email: "",
  type: "event_suggestion",
  message: "",
  website: "", // honeypot
}

/** Códigos de error definidos en el schema. Cualquier código no listado
 * acá cae al label `generic` del namespace i18n. */
const KNOWN_ERROR_CODES = new Set<string>([
  "name_too_short",
  "name_too_long",
  "email_invalid",
  "email_too_long",
  "type_invalid",
  "message_too_short",
  "message_too_long",
])

export default function ContactForm() {
  const tForm = useTranslations("contact.form")
  const tTypes = useTranslations("contact.form.types")
  const tErrors = useTranslations("contact.form.errors")
  const tSuccess = useTranslations("contact.success")
  const tError = useTranslations("contact.error")
  const locale = useLocale()
  const errorMessageFor = (code: string): string =>
    KNOWN_ERROR_CODES.has(code) ? tErrors(code) : tErrors("generic")

  const [values, setValues] = useState<ContactInput>(INITIAL_STATE)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [sentName, setSentName] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function update<K extends keyof ContactInput>(key: K, value: ContactInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
    // Limpiar el error del campo al escribir — feedback positivo sin
    // tener que re-submittear para ver que se corrigió.
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  function reset() {
    setValues(INITIAL_STATE)
    setFieldErrors({})
    setSentName(null)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const parsed = contactSchema.safeParse(values)
    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]
        if (typeof path === "string" && !next[path as keyof ContactInput]) {
          next[path as keyof ContactInput] = errorMessageFor(issue.message)
        }
      }
      setFieldErrors(next)
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // El server usa este header para resolver el label legible
            // del `type` en el subject del email.
            "x-locale": locale,
          },
          body: JSON.stringify(parsed.data),
        })
        if (res.ok) {
          setSentName(parsed.data.name)
          return
        }
        // 400 validation_error: el server rechazó por schema (drift entre
        // cliente y server, o usuario tampering con el payload). Volcamos
        // las `issues` a fieldErrors para que el user vea exactamente qué
        // campo está mal. Cualquier otro status (5xx, 429, etc) cae al
        // toast genérico de "problema de conexión".
        if (res.status === 400) {
          const body = (await res.json().catch(() => null)) as
            | { issues?: Array<{ path: (string | number)[]; message: string }> }
            | null
          if (body?.issues?.length) {
            const next: FieldErrors = {}
            for (const issue of body.issues) {
              const path = issue.path[0]
              if (typeof path === "string" && !next[path as keyof ContactInput]) {
                next[path as keyof ContactInput] = errorMessageFor(issue.message)
              }
            }
            setFieldErrors(next)
            return
          }
        }
        toast.error(tError("title"), { description: tError("body") })
      } catch {
        toast.error(tError("title"), { description: tError("body") })
      }
    })
  }

  if (sentName) {
    return (
      <div
        className="flex flex-col items-center gap-l text-center py-2xl"
        role="status"
      >
        <div className="w-16 h-16 rounded-full bg-editorial/15 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-editorial" aria-hidden />
        </div>
        <Eyebrow accent="editorial">{tSuccess("eyebrow")}</Eyebrow>
        <h2 className="text-heading-l font-display text-fg-primary">
          {tSuccess("title", { name: sentName })}
        </h2>
        <p className="text-body text-fg-secondary max-w-[40ch] leading-relaxed">
          {tSuccess("body")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-s">
          <Button asChild variant="outline">
            <Link href="/">{tSuccess("backHome")}</Link>
          </Button>
          <Button onClick={reset} variant="ghost">
            {tSuccess("sendAnother")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-l" noValidate>
      <div className="flex flex-col gap-xs">
        <Label htmlFor="contact-name">{tForm("name")}</Label>
        <Input
          id="contact-name"
          name="name"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder={tForm("namePlaceholder")}
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
        />
        {fieldErrors.name ? (
          <p id="contact-name-error" className="text-body-s text-status-danger">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-xs">
        <Label htmlFor="contact-email">{tForm("email")}</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder={tForm("emailPlaceholder")}
          required
          maxLength={254}
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
        />
        {fieldErrors.email ? (
          <p id="contact-email-error" className="text-body-s text-status-danger">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-xs">
        <Label htmlFor="contact-type">{tForm("type")}</Label>
        <select
          id="contact-type"
          name="type"
          value={values.type}
          onChange={(e) => update("type", e.target.value as ContactType)}
          required
          aria-invalid={Boolean(fieldErrors.type)}
          aria-describedby={fieldErrors.type ? "contact-type-error" : undefined}
          className={cn(
            "h-9 rounded-m border border-input bg-bg-surface px-s text-body-s",
            "text-fg-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
          )}
        >
          {CONTACT_TYPES.map((value) => (
            <option key={value} value={value}>
              {tTypes(CONTACT_TYPE_I18N_KEY[value])}
            </option>
          ))}
        </select>
        {fieldErrors.type ? (
          <p id="contact-type-error" className="text-body-s text-status-danger">
            {fieldErrors.type}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-xs">
        <Label htmlFor="contact-message">{tForm("message")}</Label>
        <Textarea
          id="contact-message"
          name="message"
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder={tForm("messagePlaceholder")}
          rows={6}
          required
          minLength={10}
          maxLength={2000}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={
            fieldErrors.message ? "contact-message-error" : "contact-message-hint"
          }
          className="resize-y"
        />
        {fieldErrors.message ? (
          <p id="contact-message-error" className="text-body-s text-status-danger">
            {fieldErrors.message}
          </p>
        ) : (
          <p id="contact-message-hint" className="text-body-s text-fg-tertiary">
            {tForm("messageHint")}
          </p>
        )}
      </div>

      {/* Honeypot — campo invisible para humanos pero llenable por bots
          de spam clásicos. Si llega no-vacío, el server descarta el
          request silenciosamente. `aria-hidden` + `tabIndex={-1}` para
          que asistencias técnicas y navegación por teclado lo salteen.
          `autoComplete="off"` y `name="website"` (campo común que los
          bots agresivos completan por inferencia del name). */}
      <div aria-hidden className="absolute -left-[9999px] w-0 h-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website ?? ""}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="self-start rounded-pill bg-brand text-on-brand font-semibold px-xl py-m text-body-l hover:bg-brand-dim disabled:opacity-60"
      >
        {isPending ? tForm("submitting") : tForm("submit")}
      </Button>
    </form>
  )
}
