/**
 * BrandLockup — BrandMark + texto "La Huella / del Caminante".
 *
 * Versiones:
 *  - `horizontal` (default): mark size `m` a la izquierda, dos líneas a la derecha.
 *  - `vertical`: mark size `l` arriba centrado, dos líneas debajo centradas.
 *
 * Si recibe `href`, el lockup entero se renderiza como `<Link>`. Si no, como
 * `<div>`. Esto le permite servir tanto como logo clickeable en Header como
 * para usos no-interactivos (footer, splash, emails).
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

  const content = (
    <span
      className={cn(
        "inline-flex font-display font-bold leading-[0.95] tracking-tight",
        isHorizontal
          ? "flex-row items-center gap-m"
          : "flex-col items-center gap-s text-center",
        className
      )}
    >
      <BrandMark size={isHorizontal ? "m" : "l"} />
      <span
        className={cn(
          "flex flex-col",
          isHorizontal ? "text-body-l" : "text-heading-m"
        )}
      >
        <span>La Huella</span>
        <span className="text-brand">del Caminante</span>
      </span>
    </span>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex shrink-0 group"
        aria-label="La Huella del Caminante — inicio"
      >
        {content}
      </Link>
    )
  }

  return content
}
