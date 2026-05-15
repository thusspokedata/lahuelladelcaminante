/**
 * Chip — pill estático para tags, etiquetas de género, badges no-interactivos.
 *
 * Para chips clickeables (filtros, toggles), usar `ChipButton` (mismo look,
 * client component con `onClick`). Las clases compartidas viven en
 * `chip-styles.ts` — modificar ahí si cambian.
 *
 * Props clave:
 *  - `accent`: tinte del pill cuando `active`. Default `neutral` (incluido
 *    en el set porque el "neutral activo" es un estado válido distinto al
 *    pill idle muteado).
 *  - `active`: si `true`, el chip toma el color del accent. Si `false`, se
 *    renderiza muteado (surface-2 + fg-secondary).
 *  - `size`: `s` compacto (cards densas) o `m` default (filter bars).
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

import { cn } from "@/lib/utils"
import type { Accent, SmallSize } from "@/components/types"
import { CHIP_ACTIVE_BG, CHIP_BASE, CHIP_IDLE_BG, CHIP_SIZE } from "./chip-styles"

export interface ChipProps {
  children: React.ReactNode
  accent?: Accent
  active?: boolean
  size?: SmallSize
  className?: string
}

export default function Chip({
  children,
  accent = "neutral",
  active = false,
  size = "m",
  className,
}: ChipProps) {
  return (
    <span
      className={cn(
        CHIP_BASE,
        CHIP_SIZE[size],
        active ? CHIP_ACTIVE_BG[accent] : CHIP_IDLE_BG,
        className
      )}
    >
      {children}
    </span>
  )
}
