/**
 * BrandMark — ícono cuadrado de la marca (huella estilizada sobre fondo sangre).
 *
 * Variantes:
 *  - `default` (sangre, huella crema): uso primario, header, lockup.
 *  - `muted` (surface-2, huella crema): contextos secundarios o sobre fondos
 *    ya marcados (ej. dentro de cards con accent propio).
 *
 * Tamaños s/m/l mapean a 24px/40px/72px.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

import { cn } from "@/lib/utils"
import type { Size } from "@/components/types"

export interface BrandMarkProps {
  size?: Size
  variant?: "default" | "muted"
  className?: string
}

const SIZE_PX: Record<Size, number> = {
  s: 24,
  m: 40,
  l: 72,
}

const SIZE_RADIUS: Record<Size, string> = {
  s: "rounded-s",
  m: "rounded-m",
  l: "rounded-l",
}

export default function BrandMark({
  size = "m",
  variant = "default",
  className,
}: BrandMarkProps) {
  const px = SIZE_PX[size]
  const bg = variant === "default" ? "bg-brand" : "bg-bg-surface-2"
  const fg = variant === "default" ? "text-on-brand" : "text-fg-primary"

  return (
    <span
      role="img"
      aria-label="La Huella del Caminante"
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        SIZE_RADIUS[size],
        bg,
        fg,
        className
      )}
      style={{ width: px, height: px }}
    >
      <FootprintSvg size={px} />
    </span>
  )
}

/**
 * SVG inline: huella estilizada simple. Tres "dedos" pequeños arriba y
 * la planta debajo, todo en `currentColor` para que herede el `text-*`
 * del contenedor.
 */
function FootprintSvg({ size }: { size: number }) {
  // El SVG ocupa el 55% del contenedor para que el ícono tenga aire.
  const inner = Math.round(size * 0.55)
  return (
    <svg
      width={inner}
      height={inner}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Dedo central (más grande) */}
      <ellipse cx="12" cy="4.5" rx="2" ry="2.5" />
      {/* Dedos laterales */}
      <ellipse cx="7" cy="6" rx="1.6" ry="2" />
      <ellipse cx="17" cy="6" rx="1.6" ry="2" />
      {/* Planta del pie (forma de gota invertida) */}
      <path d="M12 10c-3.5 0-6 2.7-6 6.5 0 2.6 1.8 4.5 3.6 4.5 1 0 1.8-.5 2.4-1.2.6.7 1.4 1.2 2.4 1.2 1.8 0 3.6-1.9 3.6-4.5 0-3.8-2.5-6.5-6-6.5z" />
    </svg>
  )
}
