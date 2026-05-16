/**
 * ChipButton — versión interactiva de `Chip`. Mismo look, pero render como
 * `<button>` con `onClick`, focus ring, hover, y `aria-pressed` cuando es
 * toggle. Las clases compartidas viven en `chip-styles.ts`.
 *
 * Usado en filter bars (toggle de género/ciudad), tabs no-stateful, etc.
 * Para tags estáticos o badges, usar `Chip` (server component).
 *
 * Nota sobre `accent`: igual que `Chip`, se acepta `Accent` completo
 * (incluye `neutral`) porque hay casos donde el toggle activo neutral es un
 * estado válido distinto al idle muteado.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

"use client"

import { cn } from "@/lib/utils"
import type { Accent, SmallSize } from "@/components/types"
import { CHIP_ACTIVE_BG, CHIP_BASE, CHIP_IDLE_BG, CHIP_SIZE } from "./chip-styles"

export interface ChipButtonProps {
  children: React.ReactNode
  onClick?: () => void
  accent?: Accent
  active?: boolean
  size?: SmallSize
  disabled?: boolean
  className?: string
  /** Si el chip funciona como toggle (on/off), pasar `true` para que se
   * exponga `aria-pressed`. Si funciona como acción simple, dejar `false`. */
  toggle?: boolean
}

export default function ChipButton({
  children,
  onClick,
  accent = "neutral",
  active = false,
  size = "m",
  disabled = false,
  className,
  toggle = false,
}: ChipButtonProps) {
  const idleWithInteraction = cn(
    CHIP_IDLE_BG,
    "hover:bg-bg-surface-3 hover:text-fg-primary"
  )

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={toggle ? active : undefined}
      className={cn(
        CHIP_BASE,
        "transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        CHIP_SIZE[size],
        active ? CHIP_ACTIVE_BG[accent] : idleWithInteraction,
        className
      )}
    >
      {children}
    </button>
  )
}
