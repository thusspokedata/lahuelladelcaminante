/**
 * ChipButton — versión interactiva de `Chip`. Mismo look, pero render como
 * `<button>` con `onClick`, focus ring, hover, y aria-pressed cuando es toggle.
 *
 * Usado en filter bars (toggle de género/ciudad), tabs no-stateful, etc. Para
 * tags estáticos o badges, usar `Chip` (server component).
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

"use client"

import { cn } from "@/lib/utils"
import type { Accent } from "@/components/types"

export interface ChipButtonProps {
  children: React.ReactNode
  onClick?: () => void
  accent?: Accent
  active?: boolean
  size?: "s" | "m"
  disabled?: boolean
  className?: string
  /** Si el chip funciona como toggle (on/off), pasar `true` para que se
   * exponga `aria-pressed`. Si funciona como acción simple, dejar `false`. */
  toggle?: boolean
}

const ACTIVE_BG: Record<Accent, string> = {
  brand: "bg-brand text-on-brand border-brand",
  editorial: "bg-editorial text-on-editorial border-editorial",
  creator: "bg-creator text-on-creator border-creator",
  neutral: "bg-fg-primary text-bg-page border-fg-primary",
}

const SIZE_CLASS: Record<"s" | "m", string> = {
  s: "text-caption px-s py-[2px]",
  m: "text-body-s px-m py-xs",
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
  const colors = active
    ? ACTIVE_BG[accent]
    : "bg-bg-surface-2 text-fg-secondary border-border hover:bg-bg-surface-3 hover:text-fg-primary"

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={toggle ? active : undefined}
      className={cn(
        "inline-flex items-center rounded-pill border font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        SIZE_CLASS[size],
        colors,
        className
      )}
    >
      {children}
    </button>
  )
}
