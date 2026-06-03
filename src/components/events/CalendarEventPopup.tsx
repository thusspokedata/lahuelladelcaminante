"use client"

/**
 * CalendarEventPopup — popup que aparece al hacer click en un evento
 * del calendario.
 *
 * Desktop: posicionado cerca del elemento clicado (anchorRect).
 * Mobile (anchorRect === null): centrado en pantalla con overlay oscuro.
 *
 * Cierra con Escape o click fuera.
 */

import { useEffect, useRef } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { CalendarEntry } from "@/services/calendar"

interface CalendarEventPopupProps {
  entry: CalendarEntry
  anchorRect: DOMRect | null
  locale: string
  onClose: () => void
}

export default function CalendarEventPopup({
  entry,
  anchorRect,
  locale,
  onClose,
}: CalendarEventPopupProps) {
  const t = useTranslations("calendar")
  const router = useRouter()
  const popupRef = useRef<HTMLDivElement>(null)
  const isMobile = anchorRect === null

  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  // Cerrar con click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClick)
    }
  }, [onClose])

  // Mover foco al dialog al abrir
  useEffect(() => {
    popupRef.current?.focus()
  }, [])

  // Calcular posición desktop
  const style: React.CSSProperties = isMobile
    ? {}
    : (() => {
        const POPUP_WIDTH = 220
        const POPUP_HEIGHT = 160
        const MARGIN = 8
        const vw = window.innerWidth
        const vh = window.innerHeight
        let left = anchorRect.left
        let top = anchorRect.bottom + MARGIN

        if (left + POPUP_WIDTH > vw - MARGIN) {
          left = vw - POPUP_WIDTH - MARGIN
        }
        if (top + POPUP_HEIGHT > vh - MARGIN) {
          top = anchorRect.top - POPUP_HEIGHT - MARGIN
        }

        return { position: "fixed", left, top, width: POPUP_WIDTH, zIndex: 50 }
      })()

  const isOfficial = entry.type === "event"
  const accentColor = isOfficial ? "#c0392b" : "#e5a93b"
  const borderColor = isOfficial ? "rgba(192,57,43,0.35)" : "rgba(229,169,59,0.35)"

  const popup = (
    <div
      ref={popupRef}
      tabIndex={-1}
      style={style}
      className={cn(
        "bg-bg-subtle rounded-xl border border-border p-4 shadow-xl",
        isMobile && "w-[280px] max-w-[90vw]"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={entry.title}
    >
      {/* Badge de tipo */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: accentColor }}
        />
        <span
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: accentColor }}
        >
          {isOfficial ? "La Huella" : t("sceneEventBadge")}
        </span>
      </div>

      {/* Fecha + título */}
      <p className="text-caption text-fg-tertiary mb-1">
        {new Date(entry.date + "T12:00:00").toLocaleDateString(
          locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "es-AR",
          { weekday: "short", day: "numeric", month: "short" }
        )}
        {entry.time ? ` · ${entry.time}` : ""}
      </p>
      <p className="text-body font-bold text-fg-primary mb-1 leading-tight">
        {entry.title}
      </p>
      {entry.venue && (
        <p className="text-body-s text-fg-secondary mb-3">{entry.venue}</p>
      )}

      {/* CTA */}
      {isOfficial && entry.slug ? (
        <button
          onClick={() => {
            router.push(`/events/${entry.slug}`)
            onClose()
          }}
          className="w-full text-center text-body-s font-bold py-2 rounded-m text-on-brand"
          style={{ background: accentColor }}
        >
          {t("viewEvent")}
        </button>
      ) : entry.externalUrl ? (
        <a
          href={entry.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="block w-full text-center text-body-s font-bold py-2 rounded-m border"
          style={{ color: accentColor, borderColor }}
        >
          {t("viewSource")}
        </a>
      ) : null}
    </div>
  )

  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={onClose}
          aria-hidden
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">{popup}</div>
        </div>
      </>
    )
  }

  return popup
}
