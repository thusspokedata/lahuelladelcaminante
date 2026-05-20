"use client"

/**
 * CookieNotice — aviso informativo de cookies.
 *
 * El sitio solo usa cookies técnicas esenciales (sesión de Better Auth y
 * la preferencia de idioma `NEXT_LOCALE`) — sin analytics ni tracking.
 * Por eso esto NO es un consent banner con bloqueo previo: es un aviso,
 * no pide aceptar nada y no bloquea la navegación. Solo informa y linkea
 * a la Datenschutzerklärung.
 *
 * El estado "ya lo cerré" se persiste en `localStorage` (es la app real,
 * no un artifact). Mientras el effect no corrió no se renderiza nada, así
 * no hay flash de un aviso que el usuario ya descartó.
 *
 * Se monta en `[locale]/layout.tsx` para que aparezca en todas las rutas.
 */

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

const STORAGE_KEY = "lhdc-cookie-notice-dismissed"

export default function CookieNotice() {
  const t = useTranslations("cookieNotice")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") setVisible(true)
    } catch {
      // localStorage no disponible (modo privado estricto, etc.) —
      // mostrar el aviso igual; sin persistencia reaparecerá, no es grave.
      setVisible(true)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // Sin persistencia el aviso reaparece en la próxima visita —
      // aceptable para un aviso puramente informativo.
    }
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label={t("ariaLabel")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg-surface/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-s px-l py-m sm:flex-row sm:items-center sm:gap-m">
        <p className="flex-1 text-body-s leading-relaxed text-fg-secondary">
          {t.rich("body", {
            privacyLink: (chunks) => (
              <Link
                href="/datenschutz"
                className="font-semibold text-fg-primary underline underline-offset-2 hover:text-brand"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 self-start rounded-xs border border-border-hi px-m py-xs text-body-s font-semibold text-fg-primary transition-colors hover:bg-bg-surface-2 sm:self-auto"
        >
          {t("dismiss")}
        </button>
      </div>
    </div>
  )
}
