/**
 * SkeletonBox — bloque rectangular para skeletons de loading. Pulso sutil
 * con `animate-pulse` de Tailwind (sin shimmer custom — más sobrio y
 * consistente con el tono del diseño).
 *
 * Reusable desde los `loading.tsx` de App Router y desde composiciones
 * de skeleton (`EventCardSkeleton`, etc.). No tiene contenido — solo es
 * una caja de color con aspect ratio opcional.
 *
 * Server component. No anima JS (es CSS puro).
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §6.
 */

import { cn } from "@/lib/utils"

export interface SkeletonBoxProps {
  /** Aspect ratio del bloque. `auto` deja al caller controlar height por
   * className (ej. para líneas de texto skeleton `h-4` directo). */
  aspectRatio?: "4:5" | "1:1" | "16:9" | "auto"
  /** Cuál de los 3 surfaces usar como fondo. Default `surface-2` (el más
   * común para placeholders sobre fondo del page). */
  variant?: "surface" | "surface-2" | "surface-3"
  className?: string
}

const ASPECT_CLASS: Record<NonNullable<SkeletonBoxProps["aspectRatio"]>, string> =
  {
    "4:5": "aspect-[4/5]",
    "1:1": "aspect-square",
    "16:9": "aspect-video",
    auto: "",
  }

const VARIANT_BG: Record<NonNullable<SkeletonBoxProps["variant"]>, string> = {
  surface: "bg-bg-surface",
  "surface-2": "bg-bg-surface-2",
  "surface-3": "bg-bg-surface-3",
}

export default function SkeletonBox({
  aspectRatio = "auto",
  variant = "surface-2",
  className,
}: SkeletonBoxProps) {
  return (
    <div
      aria-hidden={true}
      className={cn(
        "rounded-m animate-pulse",
        VARIANT_BG[variant],
        ASPECT_CLASS[aspectRatio],
        className
      )}
    />
  )
}
