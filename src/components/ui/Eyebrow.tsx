/**
 * Eyebrow — texto chico todo mayúsculas con tracking ancho, en mono.
 *
 * Útil para los "EN VIVO · MÚSICA LATINA · ALEMANIA" del hero, "DESTACADOS"
 * arriba de SectionHeader, "01 / 03" de StepCard, etc. Centraliza las clases
 * para no repetirlas en cada lugar.
 *
 * Tinte opcional con `accent` (brand/editorial/creator). Default neutral
 * usa `text-fg-secondary` para no competir con el título debajo.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

import { cn } from "@/lib/utils"
import type { Accent } from "@/components/types"

export interface EyebrowProps {
  children: React.ReactNode
  accent?: Accent
  className?: string
  as?: "span" | "p" | "div"
}

const ACCENT_COLOR: Record<Accent, string> = {
  brand: "text-brand",
  editorial: "text-editorial",
  creator: "text-creator",
  neutral: "text-fg-secondary",
}

export default function Eyebrow({
  children,
  accent = "neutral",
  className,
  as: Tag = "span",
}: EyebrowProps) {
  return (
    <Tag
      className={cn(
        "text-eyebrow font-mono uppercase",
        ACCENT_COLOR[accent],
        className
      )}
    >
      {children}
    </Tag>
  )
}
