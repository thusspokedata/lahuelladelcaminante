/**
 * FlyerImage — wrapper unificado para renderizar flyers de evento o portraits
 * de artista. Resuelve el problema principal del rediseño: las imágenes vienen
 * en ratio Instagram (4:5 o 1:1), no en landscape, y no deben recortarse.
 *
 * Comportamiento por orden de prioridad:
 *  1. Si hay `publicId`: usa `<CldImage>` (Cloudinary) con `crop="fill"` +
 *     `gravity="auto"` y format/quality automáticos.
 *  2. Si hay `src` pero no `publicId`: usa `<Image>` de Next con object-cover.
 *  3. Si no hay ninguno: renderiza fallback de iniciales gigantes sobre un
 *     fondo con radial gradient del color accent (estilo "MS / WP / FC" del
 *     listado de artistas en el handoff).
 *
 * En v1 NO se implementa el blur-de-contención para imágenes en ratio
 * incorrecto. Si Cloudinary recorta mal, se ajusta gravity por evento desde
 * el caller. Está marcado como TODO para una iteración posterior.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §1.4 + §4.1.
 */

import Image from "next/image"
import { CldImage } from "next-cloudinary"
import { cn } from "@/lib/utils"
import type { AccentBound } from "@/components/types"

export interface FlyerImageProps {
  /** Cloudinary public ID. Si existe, se prefiere sobre `src`. */
  publicId?: string
  /** URL plana de la imagen (S3, externo, etc). Se usa solo si no hay publicId. */
  src?: string
  /** Texto alternativo. Requerido para accesibilidad. */
  alt: string
  /** Ratio del contenedor. Default `4:5` (vertical, flyer Instagram). */
  aspectRatio?: "4:5" | "1:1"
  /** Iniciales para el fallback cuando no hay imagen. Default: derivado de `alt`. */
  fallbackInitials?: string
  /** Tinte del fallback. Default `brand`. */
  fallbackAccent?: AccentBound
  /** Pasar `true` en el hero LCP para optimizar carga. */
  priority?: boolean
  className?: string
}

const ASPECT_CLASS: Record<NonNullable<FlyerImageProps["aspectRatio"]>, string> = {
  "4:5": "aspect-[4/5]",
  "1:1": "aspect-square",
}

const ASPECT_DIMENSIONS: Record<
  NonNullable<FlyerImageProps["aspectRatio"]>,
  { width: number; height: number }
> = {
  "4:5": { width: 800, height: 1000 },
  "1:1": { width: 800, height: 800 },
}

const ACCENT_GRADIENT: Record<AccentBound, string> = {
  brand:
    "from-brand-dim/40 via-bg-surface-2 to-bg-surface-2 text-on-brand",
  editorial:
    "from-editorial-dim/40 via-bg-surface-2 to-bg-surface-2 text-on-editorial",
  creator:
    "from-creator-dim/40 via-bg-surface-2 to-bg-surface-2 text-on-creator",
}

function deriveInitials(text: string): string {
  const parts = text
    .trim()
    .split(/\s+/)
    .filter((p) => /^[\p{L}\p{N}]/u.test(p))
  if (parts.length === 0) return text.slice(0, 2).toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function FlyerImage({
  publicId,
  src,
  alt,
  aspectRatio = "4:5",
  fallbackInitials,
  fallbackAccent = "brand",
  priority = false,
  className,
}: FlyerImageProps) {
  const containerClass = cn(
    "relative overflow-hidden rounded-l bg-bg-surface-2",
    ASPECT_CLASS[aspectRatio],
    className
  )

  // 1. Cloudinary
  if (publicId) {
    const { width, height } = ASPECT_DIMENSIONS[aspectRatio]
    return (
      <div className={containerClass}>
        <CldImage
          src={publicId}
          alt={alt}
          width={width}
          height={height}
          crop="fill"
          gravity="auto"
          format="auto"
          quality="auto"
          priority={priority}
          className="h-full w-full object-cover"
        />
        {/* TODO (post-PR3): blur-de-contención para flyers en ratio raro. */}
      </div>
    )
  }

  // 2. URL plana
  if (src) {
    return (
      <div className={containerClass}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    )
  }

  // 3. Fallback de iniciales
  const initials = fallbackInitials ?? deriveInitials(alt)
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        containerClass,
        "flex items-center justify-center bg-gradient-to-br",
        ACCENT_GRADIENT[fallbackAccent]
      )}
    >
      <span className="text-display-xl font-display font-extrabold leading-none select-none">
        {initials}
      </span>
    </div>
  )
}
