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
  /** Cuando es `true`, marca el elemento como `aria-hidden` y omite el
   * `aria-label`. Pasar `true` cuando se usa adentro de un componente que
   * ya provee el nombre accesible (ej. `BrandLockup` con texto visible) y
   * el mark es puramente decorativo. */
  decorative?: boolean
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
  decorative = false,
  className,
}: BrandMarkProps) {
  const px = SIZE_PX[size]
  const bg = variant === "default" ? "bg-brand" : "bg-bg-surface-2"
  const fg = variant === "default" ? "text-on-brand" : "text-fg-primary"

  const ariaProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": "La Huella del Caminante" }

  return (
    <span
      {...ariaProps}
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
 * SVG inline: huella humana (planta de pie descalzo) con 5 dedos en
 * arco descendente — pulgar grande arriba-derecha, meñique chico
 * abajo-izquierda. Asimetría sugiere pie izquierdo en movimiento.
 *
 * Reemplaza el SVG anterior (3 dedos simétricos) que se leía como
 * huella animal (perro/gato), no humana. El nuevo es el SVG principal
 * entregado por Claude Design.
 *
 * Todo en `currentColor` para que herede el `text-*` del contenedor.
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
      {/* Talón + arco + ball del pie, inclinado para sugerir movimiento. */}
      <path d="M15.6 8.4c1.8.7 2.7 3 2.3 5.6-.4 2.6-1.7 5.4-3.6 6.7-1.8 1.2-3.9 1-5.2-.4-1.3-1.5-1.6-3.7-1-6 .6-2.5 2-4.7 3.6-5.7 1.2-.7 2.6-.7 3.9-.2z" />
      {/* 5 dedos en arco descendente: pulgar → meñique. Cada elipse
          rotada para apuntar radialmente hacia afuera del pad. */}
      <ellipse cx="15.2" cy="4.7" rx="1.55" ry="1.9" transform="rotate(8 15.2 4.7)" />
      <ellipse cx="11.6" cy="3.4" rx="1.3" ry="1.65" transform="rotate(-6 11.6 3.4)" />
      <ellipse cx="8.4" cy="3.6" rx="1.1" ry="1.45" transform="rotate(-18 8.4 3.6)" />
      <ellipse cx="5.7" cy="4.6" rx="0.95" ry="1.25" transform="rotate(-30 5.7 4.6)" />
      <ellipse cx="3.8" cy="6.3" rx="0.8" ry="1.05" transform="rotate(-44 3.8 6.3)" />
    </svg>
  )
}
