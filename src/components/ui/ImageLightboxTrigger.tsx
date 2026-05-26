"use client"

/**
 * A `<button>` wrapper that opens the lightbox at a specific index when
 * clicked. Must be a descendant of `<ImageLightboxRoot>`.
 *
 * The trigger renders as a block-level button so it can wrap larger
 * image components (the artist portrait, event hero) without breaking
 * layout. `cursor-zoom-in` signals the click affordance.
 *
 * Spec: docs/superpowers/specs/2026-05-27-image-lightbox-design.md
 */

import { useImageLightbox } from "./ImageLightboxRoot"
import { cn } from "@/lib/utils"

interface ImageLightboxTriggerProps {
  /** 0-based slide index in the images array passed to `<ImageLightboxRoot>`. */
  index: number
  /** Localised aria-label, e.g. "Abrir foto 2 de 5". */
  ariaLabel: string
  /** Tailwind classes added to the rendered `<button>`. */
  className?: string
  children: React.ReactNode
}

export default function ImageLightboxTrigger({
  index,
  ariaLabel,
  className,
  children,
}: ImageLightboxTriggerProps) {
  const { open } = useImageLightbox()
  return (
    <button
      type="button"
      onClick={() => open(index)}
      aria-label={ariaLabel}
      className={cn(
        "block w-full appearance-none cursor-zoom-in",
        // Remove default button focus ring inside images — we keep
        // keyboard accessibility via focus-visible on the wrapper.
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        className,
      )}
    >
      {children}
    </button>
  )
}
