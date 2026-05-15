/**
 * Chip — pill estático para tags, etiquetas de género, badges no-interactivos.
 *
 * Para chips clickeables (filtros, toggles), usar `ChipButton` (mismo look,
 * client component con `onClick`).
 *
 * Props clave:
 *  - `accent`: tinte del pill cuando `active`. Default `neutral`.
 *  - `active`: si `true`, el chip toma el color del accent. Si `false`,
 *    se renderiza como un pill muteado (surface-2).
 *  - `size`: `s` (compacto, en cards) o `m` (default, en filter bars).
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

import { cn } from "@/lib/utils"
import type { Accent } from "@/components/types"

export interface ChipProps {
  children: React.ReactNode
  accent?: Accent
  active?: boolean
  size?: "s" | "m"
  className?: string
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

export default function Chip({
  children,
  accent = "neutral",
  active = false,
  size = "m",
  className,
}: ChipProps) {
  const colors = active
    ? ACTIVE_BG[accent]
    : "bg-bg-surface-2 text-fg-secondary border-border"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border font-medium",
        SIZE_CLASS[size],
        colors,
        className
      )}
    >
      {children}
    </span>
  )
}
