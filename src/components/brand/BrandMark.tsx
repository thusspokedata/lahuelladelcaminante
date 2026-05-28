/**
 * BrandMark — ícono cuadrado de la marca.
 *
 * Renderiza `public/brand-mark.png` — diseño rupestre de cave-art con 12
 * figuras humanas en ronda celebrando alrededor de una huella ochre
 * central. El PNG ya contiene su propio fondo dark warm brown, frame
 * cream y huella `#E5A93B`, así que el wrapper sólo provee tamaño +
 * border-radius + clip; no aplica color de fondo.
 *
 * Pipeline del asset:
 *  1. Generado en Canva AI (prompt rupestre, 2000×2000 — guardado como
 *     `public/brand-mark-source.png` por si se necesita re-procesar).
 *  2. magick -trim para sacar el margen blanco del canvas.
 *  3. -extent 1200×1200 con bg del propio diseño para padding.
 *  4. -colors 16 para reducir 33k colores AI → planos limpios sin perder
 *     la textura rupestre de las figuras.
 *  5. -fuzz 12% -fill #E5A93B -opaque #FF7F0B para pasar el footprint de
 *     naranja brillante (default Canva) a ochre dorado (paleta brand).
 *
 * Tamaños s/m/l mapean a 24px/40px/72px. `variant` queda inerte porque
 * el PNG ya define su paleta; se preserva en el tipo por compatibilidad
 * con callers existentes.
 *
 * El mismo asset se usa para `apple-icon.png` (180×180) e `icon.png`
 * (512×512) vía `scripts/generate-favicons.ts`. El favicon.ico de
 * pestaña usa una fuente simplificada distinta (ver FAVICONS.md).
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Size } from "@/components/types"

export interface BrandMarkProps {
  size?: Size
  /**
   * Inerte con el asset actual (el PNG ya define su paleta). Se preserva
   * en el tipo para que callers existentes sigan compilando y para
   * habilitar variantes si en el futuro generamos un asset alternativo.
   */
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
  decorative = false,
  className,
}: BrandMarkProps) {
  const px = SIZE_PX[size]

  const ariaProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": "La Huella del Caminante" }

  return (
    <span
      {...ariaProps}
      className={cn(
        "inline-flex items-center justify-center shrink-0 overflow-hidden",
        SIZE_RADIUS[size],
        className
      )}
      style={{ width: px, height: px }}
    >
      <Image
        src="/brand-mark.png"
        alt=""
        width={px}
        height={px}
        priority
        sizes={`${px}px`}
        className="block h-full w-full object-cover"
      />
    </span>
  )
}
