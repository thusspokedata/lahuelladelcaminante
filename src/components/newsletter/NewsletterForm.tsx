"use client"

/**
 * NewsletterForm — form de suscripción reutilizable.
 *
 * Variantes:
 *  - `footer`: compacto, inline. Sin checkbox de consentimiento (implícito).
 *  - `page`: con más espacio + checkbox GDPR obligatorio.
 *
 * El idioma viene del locale activo y se manda como campo hidden.
 * El `website` es un honeypot (hidden via CSS, no `display:none`).
 */

import { useState, useTransition } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { newsletterSchema } from "@/lib/validators/newsletter"

type FormState = "idle" | "loading" | "success" | "error"

interface NewsletterFormProps {
  variant: "footer" | "page"
  /** Estado inicial de la página: confirmed=true o error=token_expired|invalid_token */
  initialState?: "confirmed" | "token_expired" | null
}

export default function NewsletterForm({ variant, initialState }: NewsletterFormProps) {
  const t = useTranslations("newsletter")
  const locale = useLocale()
  const [email, setEmail] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<FormState>("idle")
  const [isPending, startTransition] = useTransition()

  const isLoading = state === "loading" || isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsed = newsletterSchema.safeParse({ email, language: locale })
    if (!parsed.success) {
      setState("error")
      return
    }

    if (variant === "page" && !consent) return

    startTransition(() => setState("loading"))

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ email, language: locale, website: honeypot }),
      })

      if (!res.ok) {
        setState("error")
        return
      }

      setState("success")
    } catch {
      setState("error")
    }
  }

  if (state === "success") {
    return (
      <p className={cn(
        "text-fg-secondary",
        variant === "footer" ? "text-body-s" : "text-body"
      )}>
        {t("successMessage")}
      </p>
    )
  }

  if (initialState === "confirmed") {
    return (
      <p className={cn(
        "text-brand font-medium",
        variant === "footer" ? "text-body-s" : "text-body"
      )}>
        {t("confirmedBanner")}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn(
      "flex flex-col",
      variant === "footer" ? "gap-s" : "gap-m"
    )}>
      {/* Token expirado */}
      {initialState === "token_expired" && (
        <p className="text-body-s text-fg-secondary">{t("tokenExpiredMessage")}</p>
      )}

      {/* Honeypot — hidden via CSS */}
      <div style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden>
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className={cn(
        "flex",
        variant === "footer" ? "flex-row gap-xs" : "flex-col gap-s"
      )}>
        <input
          type="email"
          required
          placeholder={t("formEmailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className={cn(
            "bg-bg-subtle border border-border rounded-m text-body text-fg-primary placeholder:text-fg-tertiary",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-bg-page",
            "disabled:opacity-50",
            variant === "footer"
              ? "px-s py-xs text-body-s flex-1 min-w-0"
              : "px-m py-s w-full"
          )}
        />
        <button
          type="submit"
          disabled={isLoading || (variant === "page" && !consent)}
          className={cn(
            "bg-brand text-on-brand font-semibold rounded-m transition-opacity",
            "hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
            variant === "footer"
              ? "px-m py-xs text-body-s shrink-0"
              : "px-l py-s text-body w-full"
          )}
        >
          {isLoading ? "…" : t("formSubmit")}
        </button>
      </div>

      {/* Checkbox GDPR — solo en variante page */}
      {variant === "page" && (
        <label className="flex items-start gap-s cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-[3px] shrink-0 accent-brand"
          />
          <span className="text-body-s text-fg-secondary leading-relaxed">
            {t("formConsent")}{" "}
            <Link href="/datenschutz" className="underline hover:text-fg-primary transition-colors">
              {t("formConsentLink")}
            </Link>
          </span>
        </label>
      )}

      {state === "error" && (
        <p className="text-body-s text-fg-secondary">{t("errorMessage")}</p>
      )}
    </form>
  )
}
