/**
 * FlyerImage — wrapper unificado para renderizar flyers de evento o portraits
 * de artista. Resuelve el problema principal del rediseño: las imágenes vienen
 * en ratio Instagram (4:5 o 1:1), no en landscape, y no deben recortarse.
 *
 * Comportamiento por orden de prioridad:
 *  1. Si hay `publicId`: usa `<CldImage>` (Cloudinary) con `crop="pad"` +
 *     `gravity="auto"` y format/quality automáticos.
 *  2. Si hay `src` pero no `publicId`: usa `<Image>` de Next con object-contain.
 *  3. Si no hay ninguno: renderiza fallback de iniciales gigantes sobre un
 *     fondo con radial gradient del color accent (estilo "MS / WP / FC" del
 *     listado de artistas en el handoff).
 *
 * **Es client component** porque `<CldImage>` de `next-cloudinary` requiere
 * hooks/refs del browser. El resto del árbol que lo consume puede ser server.
 *
 * Las imágenes que no vengan en el aspect ratio target se renderizan
 * contenidas (`crop="pad"` + `object-contain`) sobre `bg-bg-surface-2`,
 * con bandas sólidas (letterbox). Es lo que pide el handoff §1.4: nunca
 * recortar texto del flyer. El blur-de-contención estilo Apple Music está
 * marcado como TODO en el cuerpo del componente, planeado para PR 5.5.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §1.4 + §4.1.
 */

"use client"

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

/**
 * Fondo del fallback: gradient teñido con el accent sobre surface-2. El texto
 * (iniciales) va en `fg-primary` (crema) para ser legible en los tres accents:
 * `on-<accent>` está pensado para texto sobre superficie acentuada plana, no
 * sobre estos gradients oscuros (en particular `on-editorial` es casi negro
 * y quedaría invisible acá).
 */
const ACCENT_GRADIENT: Record<AccentBound, string> = {
  brand: "from-brand-dim/40 via-bg-surface-2 to-bg-surface-2",
  editorial: "from-editorial-dim/40 via-bg-surface-2 to-bg-surface-2",
  creator: "from-creator-dim/40 via-bg-surface-2 to-bg-surface-2",
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
          crop="pad"
          gravity="auto"
          format="auto"
          quality="auto"
          priority={priority}
          className="h-full w-full object-contain"
        />
        {/* TODO: implement blurred background fallback (Apple Music style)
            cuando el ratio de la imagen no coincide con el aspect target.
            Hasta entonces, el padding queda sobre `bg-bg-surface-2` (letterbox
            sólido). Tracked como PR 5.5. */}
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
          className="object-contain"
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
        "flex items-center justify-center bg-gradient-to-br text-fg-primary",
        ACCENT_GRADIENT[fallbackAccent]
      )}
    >
      <span className="text-display-xl font-display leading-none select-none">
        {initials}
      </span>
    </div>
  )
}
