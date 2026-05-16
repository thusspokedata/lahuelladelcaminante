/**
 * BrandLockup — BrandMark + texto "La Huella / del Caminante".
 *
 * Versiones:
 *  - `horizontal` (default): mark size `m` a la izquierda, dos líneas a la derecha.
 *  - `vertical`: mark size `l` arriba centrado, dos líneas debajo centradas.
 *
 * Si recibe `href`, el lockup entero se renderiza como `<Link>` con
 * `aria-label` de marca. Si no, como `<span>` no interactivo. En ambos casos
 * `className` se aplica al elemento root (Link o span) para que el caller
 * pueda controlar márgenes/layout desde afuera.
 *
 * El `BrandMark` interno se renderiza con `decorative` para que el lector
 * de pantalla no anuncie dos veces el nombre del producto.
 *
 * El texto "La Huella / del Caminante" está hardcodeado porque es el nombre
 * del producto y no se traduce. La segunda línea siempre va en `text-brand`.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

import Link from "next/link"
import { cn } from "@/lib/utils"
import BrandMark from "./BrandMark"

export interface BrandLockupProps {
  orientation?: "horizontal" | "vertical"
  href?: string
  className?: string
}

export default function BrandLockup({
  orientation = "horizontal",
  href,
  className,
}: BrandLockupProps) {
  const isHorizontal = orientation === "horizontal"

  const rootClass = cn(
    "inline-flex shrink-0 font-display font-bold leading-[0.95] tracking-tight",
    isHorizontal
      ? "flex-row items-center gap-m"
      : "flex-col items-center gap-s text-center",
    className
  )

  const inner = (
    <>
      <BrandMark size={isHorizontal ? "m" : "l"} decorative />
      <span
        className={cn(
          "flex flex-col",
          isHorizontal ? "text-body-l" : "text-heading-m"
        )}
      >
        <span>La Huella</span>
        <span className="text-brand">del Caminante</span>
      </span>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        aria-label="La Huella del Caminante — inicio"
        className={rootClass}
      >
        {inner}
      </Link>
    )
  }

  return <span className={rootClass}>{inner}</span>
}
