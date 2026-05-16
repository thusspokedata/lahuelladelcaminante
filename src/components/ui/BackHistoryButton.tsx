"use client"

/**
 * BackHistoryButton — botón que invoca `history.back()`. Client por
 * necesidad (acceso a `window.history`). Recibe el label ya traducido
 * desde el server para no acoplar este primitive a un namespace i18n
 * específico.
 *
 * Si el user llegó directo al link (compartido por stories/WhatsApp),
 * `history.length <= 1` significa que `history.back()` no hace nada
 * visible o saca al user del sitio. En ese caso fallback a la home
 * del locale activo con el router locale-aware. Heurística — algunos
 * browsers inflan `history.length` con la propia carga, así que no es
 * 100% confiable, pero es buen default para tabs nuevos.
 */

import { useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

export interface BackHistoryButtonProps {
  label: string
  className?: string
}

export default function BackHistoryButton({
  label,
  className,
}: BackHistoryButtonProps) {
  const router = useRouter()

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back()
    } else {
      router.push("/")
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center rounded-pill border border-border bg-bg-surface",
        "px-l py-s text-body-s font-semibold text-fg-primary",
        "hover:border-border-hi hover:bg-bg-surface-2 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
        className
      )}
    >
      <span aria-hidden>←</span>
      <span className="ml-xs">{label}</span>
    </button>
  )
}
