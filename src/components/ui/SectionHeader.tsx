/**
 * SectionHeader — eyebrow + título grande + slot de acción a la derecha.
 *
 * Encabezado estándar de secciones en home, listings y dashboard. La acción
 * típica es un link "Ver todo →" o un botón. En mobile (< 640px) la acción
 * baja debajo del título; en desktop queda alineada a la derecha.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

import { cn } from "@/lib/utils"
import type { AccentBound } from "@/components/types"
import Eyebrow from "./Eyebrow"

export interface SectionHeaderProps {
  /** Texto pequeño en mono que va arriba del título. Opcional. */
  eyebrow?: string
  title: string
  /** Tinte del eyebrow. Default `neutral` (sin tinte). */
  accent?: AccentBound
  /** Slot a la derecha: link "Ver todo →", botón, chip, etc. */
  action?: React.ReactNode
  /** Nivel semántico del título (h1/h2/h3). Default `h2`. */
  as?: "h1" | "h2" | "h3"
  className?: string
}

export default function SectionHeader({
  eyebrow,
  title,
  accent,
  action,
  as: Tag = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-s sm:flex-row sm:items-end sm:justify-between sm:gap-m",
        className
      )}
    >
      <div className="flex flex-col gap-xs">
        {eyebrow ? <Eyebrow accent={accent ?? "neutral"}>{eyebrow}</Eyebrow> : null}
        <Tag className="text-heading-l font-display text-fg-primary">{title}</Tag>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
