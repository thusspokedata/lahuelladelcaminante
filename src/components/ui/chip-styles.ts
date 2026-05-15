/**
 * Estilos compartidos entre `Chip` (server, estático) y `ChipButton` (client,
 * interactivo). Cualquier ajuste de paddings, accent, o tamaños se hace acá
 * y se refleja en los dos.
 */

import type { Accent, SmallSize } from "@/components/types"

/** Clases base que comparten Chip y ChipButton (sin estados ni colores). */
export const CHIP_BASE = "inline-flex items-center rounded-pill border font-medium"

/** Background + texto + borde cuando el chip está en estado `active`. */
export const CHIP_ACTIVE_BG: Record<Accent, string> = {
  brand: "bg-brand text-on-brand border-brand",
  editorial: "bg-editorial text-on-editorial border-editorial",
  creator: "bg-creator text-on-creator border-creator",
  neutral: "bg-fg-primary text-bg-page border-fg-primary",
}

/** Background + texto + borde cuando el chip está en estado idle (no active).
 * No incluye hover/focus (esos los pone `ChipButton`). */
export const CHIP_IDLE_BG = "bg-bg-surface-2 text-fg-secondary border-border"

/** Paddings + tipografía según tamaño. */
export const CHIP_SIZE: Record<SmallSize, string> = {
  s: "text-caption px-s py-[2px]",
  m: "text-body-s px-m py-xs",
}
