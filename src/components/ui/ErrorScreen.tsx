"use client"

/**
 * ErrorScreen — UI compartida de error boundaries. Lo usan
 * `[locale]/error.tsx` (austero, sin shell), `(public)/error.tsx`
 * (con Header/Footer) y `(protected)/dashboard/error.tsx` (dentro del
 * DashboardShell). Centraliza copy/CTAs/dev panel para que actualizar
 * un detalle no requiera tocar 3 archivos.
 *
 * Es client porque los 3 callers son client components (contrato Next
 * de `error.tsx`) y porque consume `useTranslations`.
 *
 * El botón principal llama `onRetry`, que típicamente es el
 * `unstable_retry` de Next 16+ (re-fetchea el segmento desde el server).
 *
 * En `process.env.NODE_ENV === "development"` muestra `error.digest`
 * y `error.message` en un `<pre>`. En production NO los muestra (puede
 * leakear info interna).
 *
 * **A11y**: no usamos `role="alert"` ni `aria-live` sobre el `<main>`
 * entero porque el screen reader ya lo lee al navegar al landmark y
 * el rol "alert" está pensado para banners/toasts dinámicos, no
 * pantallas completas.
 */

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import Eyebrow from "@/components/ui/Eyebrow"

export interface ErrorScreenProps {
  error: Error & { digest?: string }
  /** Re-render del segmento. Pasale el `unstable_retry` (Next 16.2+) o
   * el viejo `reset` si el caller no necesita re-fetch. */
  onRetry: () => void
  /**
   * Origen del log para identificar de cuál boundary vino (útil en dev).
   * El reporting real (Sentry, etc.) está fuera de scope de este PR
   * (decisión de producto).
   */
  logSource?: string
  className?: string
}

export default function ErrorScreen({
  error,
  onRetry,
  logSource = "error",
  className,
}: ErrorScreenProps) {
  const t = useTranslations("error")

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error(`[${logSource}]`, error)
    }
  }, [error, logSource])

  const isDev = process.env.NODE_ENV === "development"

  return (
    <div
      className={cn(
        "flex-1 flex items-center justify-center px-m py-2xl",
        className
      )}
    >
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-m">
        <Eyebrow accent="brand">{t("eyebrow")}</Eyebrow>
        <h1 className="text-display-m sm:text-display-l font-display leading-tight text-fg-primary">
          {t("title")}
        </h1>
        <p className="text-body-l text-fg-secondary max-w-[50ch] leading-relaxed">
          {t("body")}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-s mt-m w-full sm:w-auto">
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              "inline-flex items-center justify-center rounded-pill bg-brand text-on-brand",
              "font-semibold px-l py-s text-body-s hover:bg-brand-dim transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
            )}
          >
            {t("cta.retry")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-pill border border-border bg-bg-surface text-fg-primary font-semibold px-l py-s text-body-s hover:border-border-hi hover:bg-bg-surface-2 transition-colors"
          >
            {t("cta.home")}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-pill border border-transparent text-fg-secondary font-semibold px-l py-s text-body-s hover:text-fg-primary hover:bg-bg-surface-2 transition-colors"
          >
            {t("cta.contact")} →
          </Link>
        </div>

        {isDev ? (
          <pre className="mt-l w-full max-w-2xl overflow-x-auto rounded-m border border-border bg-bg-surface-2 p-m text-left text-body-s text-fg-secondary">
            {error.digest ? `digest: ${error.digest}\n` : ""}
            {error.message}
          </pre>
        ) : null}
      </div>
    </div>
  )
}
