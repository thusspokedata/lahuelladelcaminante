"use client"

/**
 * Wraps a section of a server page and provides the lightbox UI + the
 * context that `<ImageLightboxTrigger>` reads to open it.
 *
 * Why provider + trigger (vs inline state per page): on artist/event
 * detail pages the cover and gallery live in different columns of the
 * 12-col grid. Sharing lightbox state across the layout boundary via
 * context keeps the server page declarative and avoids prop drilling.
 *
 * Spec: docs/superpowers/specs/2026-05-27-image-lightbox-design.md
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import Lightbox from "yet-another-react-lightbox"
import Captions from "yet-another-react-lightbox/plugins/captions"
import Counter from "yet-another-react-lightbox/plugins/counter"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import { useTranslations } from "next-intl"

// Library CSS — Next loads these into the global stylesheet because this
// is a client component. Each plugin ships its own optional stylesheet.
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/captions.css"
import "yet-another-react-lightbox/plugins/counter.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"

export interface ImageEntry {
  src: string
  alt: string
}

interface LightboxContextValue {
  open: (index: number) => void
}

const LightboxContext = createContext<LightboxContextValue | null>(null)

/**
 * Hook used by `<ImageLightboxTrigger>`. Throws if the trigger is used
 * outside a `<ImageLightboxRoot>` so the bug surfaces early.
 */
export function useImageLightbox(): LightboxContextValue {
  const ctx = useContext(LightboxContext)
  if (!ctx) {
    throw new Error(
      "useImageLightbox must be used inside <ImageLightboxRoot>",
    )
  }
  return ctx
}

interface ImageLightboxRootProps {
  images: ImageEntry[]
  children: React.ReactNode
}

export default function ImageLightboxRoot({
  images,
  children,
}: ImageLightboxRootProps) {
  const t = useTranslations("lightbox")
  const [openState, setOpenState] = useState<{ isOpen: boolean; index: number }>(
    { isOpen: false, index: 0 },
  )

  const open = useCallback((index: number) => {
    setOpenState({ isOpen: true, index })
  }, [])

  const value = useMemo<LightboxContextValue>(() => ({ open }), [open])

  // Library expects slides with `src` for the image, `alt` for the img
  // attribute and `description` for the Captions plugin display. We use
  // the same alt string in both — that's the only text we have.
  const slides = useMemo(
    () =>
      images.map((img) => ({
        src: img.src,
        alt: img.alt,
        description: img.alt,
      })),
    [images],
  )

  return (
    <LightboxContext.Provider value={value}>
      {children}
      <Lightbox
        open={openState.isOpen}
        close={() => setOpenState((s) => ({ ...s, isOpen: false }))}
        index={openState.index}
        slides={slides}
        plugins={[Captions, Counter, Thumbnails, Zoom]}
        labels={{
          Close: t("close"),
          Next: t("next"),
          Previous: t("previous"),
        }}
      />
    </LightboxContext.Provider>
  )
}
