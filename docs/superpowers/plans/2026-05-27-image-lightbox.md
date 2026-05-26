# Image Lightbox / Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every public image on `/artists/[slug]` and `/events/[slug]` clickable, opening a fullscreen lightbox/carousel that cycles through all images on the page. Also add a new gallery section to event detail (mirror of restored artist gallery).

**Architecture:** One client provider + one client trigger button, sharing state via React context. Lightbox UI provided by `yet-another-react-lightbox` library with 4 plugins (Counter, Captions, Zoom, Thumbnails). Server pages build the images array from existing Prisma includes; no schema changes.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · next-intl · Tailwind v4 · `yet-another-react-lightbox` (new)

**Spec:** `docs/superpowers/specs/2026-05-27-image-lightbox-design.md`

**Branch:** `feat/image-lightbox` (already created, spec committed as `7ba4c83`)

**Pre-push rigor:** Apply `feedback_pre_push_rigor.md` checklist before pushing. Specifically watch for: i18n keys missing from any locale (#6), aria/alt strings localised (#7), ES voseo (#8), DE declensions (#9).

---

## File Structure

**New files:**
- `src/components/ui/ImageLightboxRoot.tsx` — client, context provider + the actual `<Lightbox>` UI from library
- `src/components/ui/ImageLightboxTrigger.tsx` — client, `<button>` wrapper that opens lightbox at a given index

**Modified files:**
- `src/app/[locale]/(public)/artists/[slug]/page.tsx` — wrap portrait + each gallery item in triggers, wrap grid in root
- `src/app/[locale]/(public)/events/[slug]/page.tsx` — same as artist + add new gallery section between About and MoreDates
- `src/messages/es.json` — add `lightbox` namespace + `eventDetail.photosLabel`
- `src/messages/en.json` — same
- `src/messages/de.json` — same
- `package.json` + `package-lock.json` — add dependency

---

## Task 1: Install dependency + add i18n keys

**Files:**
- Modify: `package.json` (add dep)
- Modify: `src/messages/es.json` (add `lightbox` namespace + `eventDetail.photosLabel`)
- Modify: `src/messages/en.json` (same)
- Modify: `src/messages/de.json` (same)

- [ ] **Step 1: Install `yet-another-react-lightbox`**

Run: `pnpm add yet-another-react-lightbox`
Expected: package added to `dependencies` in package.json; lockfile updated.

- [ ] **Step 2: Verify library version supports React 19**

Run: `pnpm list yet-another-react-lightbox`
Expected: version `3.x` printed. Open `node_modules/yet-another-react-lightbox/package.json` and confirm `peerDependencies.react` includes `19` (or wildcard like `>=17`). If not, abort and report — this is a blocker.

- [ ] **Step 3: Add `eventDetail.photosLabel` to `src/messages/es.json`**

Find the `eventDetail` namespace and append the new key. Use `Read` first to locate the closing `}` of `eventDetail`. Insert before the closing brace:

```json
    "photosLabel": "Fotos",
```

(Make sure the previous line ends with `,` and that this is the last key, no trailing comma.)

- [ ] **Step 4: Add `eventDetail.photosLabel` to `src/messages/en.json`**

Same location in en.json:

```json
    "photosLabel": "Photos",
```

- [ ] **Step 5: Add `eventDetail.photosLabel` to `src/messages/de.json`**

Same location in de.json:

```json
    "photosLabel": "Fotos",
```

- [ ] **Step 6: Add `lightbox` namespace to `src/messages/es.json`**

After the closing `}` of an existing top-level namespace (e.g., after `eventDetail`), add the new namespace. Use comma to separate from the next:

```json
  "lightbox": {
    "close": "Cerrar",
    "next": "Siguiente",
    "previous": "Anterior",
    "openImage": "Abrir foto {index} de {total}"
  },
```

- [ ] **Step 7: Add `lightbox` namespace to `src/messages/en.json`**

```json
  "lightbox": {
    "close": "Close",
    "next": "Next",
    "previous": "Previous",
    "openImage": "Open photo {index} of {total}"
  },
```

- [ ] **Step 8: Add `lightbox` namespace to `src/messages/de.json`**

```json
  "lightbox": {
    "close": "Schließen",
    "next": "Weiter",
    "previous": "Zurück",
    "openImage": "Foto {index} von {total} öffnen"
  },
```

- [ ] **Step 9: Verify JSON validity for all 3 locales**

Run: `node -e "['es','en','de'].forEach(l => JSON.parse(require('fs').readFileSync('src/messages/'+l+'.json','utf8')))"`
Expected: exit code 0, no output.
If a JSON parse error appears, fix the trailing-comma / missing-comma issue at the insertion point and re-run.

- [ ] **Step 10: TS check**

Run: `pnpm exec tsc --noEmit`
Expected: `TypeScript: No errors found`.

- [ ] **Step 11: Commit**

```bash
git add package.json pnpm-lock.yaml src/messages/es.json src/messages/en.json src/messages/de.json
git commit -S -m "chore(lightbox): add yet-another-react-lightbox dep + i18n keys

- Adds yet-another-react-lightbox to dependencies (used by the new
  ImageLightboxRoot component).
- Adds eventDetail.photosLabel to es/en/de (used by the new event
  gallery section heading).
- Adds new \`lightbox\` namespace (close/next/previous/openImage) for
  the lightbox UI labels and trigger aria-labels.

No runtime code yet — components and page wiring land in follow-up commits."
```

---

## Task 2: Create `ImageLightboxRoot` component

**Files:**
- Create: `src/components/ui/ImageLightboxRoot.tsx`

- [ ] **Step 1: Create the file with full code**

```tsx
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
  const [openState, setOpenState] = useState<{ open: boolean; index: number }>(
    { open: false, index: 0 },
  )

  const open = useCallback((index: number) => {
    setOpenState({ open: true, index })
  }, [])

  const value = useMemo<LightboxContextValue>(() => ({ open }), [open])

  // Library expects slides with `src` for the image, `alt` for the img
  // attribute and `description` for the Captions plugin display. We use
  // the same alt string in both — that's the only text we have.
  const slides = images.map((img) => ({
    src: img.src,
    alt: img.alt,
    description: img.alt,
  }))

  return (
    <LightboxContext.Provider value={value}>
      {children}
      <Lightbox
        open={openState.open}
        close={() => setOpenState((s) => ({ ...s, open: false }))}
        index={openState.index}
        slides={slides}
        plugins={[Captions, Counter, Thumbnails, Zoom]}
        labels={{
          Close: t("close"),
          Next: t("next"),
          Previous: t("previous"),
        }}
        // Counter: top-left corner by default; library handles styling.
        // Captions: bottom of the viewport.
        // Zoom: pinch on touch + scroll-wheel on desktop.
        // Thumbnails: strip at the bottom of the viewport.
      />
    </LightboxContext.Provider>
  )
}
```

- [ ] **Step 2: TS check**

Run: `pnpm exec tsc --noEmit`
Expected: `TypeScript: No errors found`.

If errors appear about missing types for `yet-another-react-lightbox`, the package ships its own types — verify `node_modules/yet-another-react-lightbox/dist/index.d.ts` exists. If not, abort.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ImageLightboxRoot.tsx
git commit -S -m "feat(lightbox): add ImageLightboxRoot client provider

Wraps yet-another-react-lightbox with the 4 plugins we want (Counter,
Captions, Zoom, Thumbnails) and exposes \`open(index)\` via React
context so triggers anywhere in the children can open at a specific
slide. Slide captions use the image alt text.

i18n labels (close/next/previous) read from the new \`lightbox\`
namespace via next-intl.

Pairs with ImageLightboxTrigger (next commit)."
```

---

## Task 3: Create `ImageLightboxTrigger` component

**Files:**
- Create: `src/components/ui/ImageLightboxTrigger.tsx`

- [ ] **Step 1: Create the file with full code**

```tsx
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
```

- [ ] **Step 2: TS check**

Run: `pnpm exec tsc --noEmit`
Expected: `TypeScript: No errors found`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ImageLightboxTrigger.tsx
git commit -S -m "feat(lightbox): add ImageLightboxTrigger button wrapper

Renders a block-level <button> that calls \`open(index)\` from the
lightbox context on click. Wraps any image-rendering JSX. Default
classes:

  block w-full appearance-none cursor-zoom-in
  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand

Caller supplies the localised aria-label (server pages have access to
next-intl translations to compose 'Abrir foto N de TOTAL')."
```

---

## Task 4: Wire up `/artists/[slug]/page.tsx`

**Files:**
- Modify: `src/app/[locale]/(public)/artists/[slug]/page.tsx`

- [ ] **Step 1: Read the current file**

Use `Read` on `src/app/[locale]/(public)/artists/[slug]/page.tsx` to refresh the exact current content. The structure at the time of this plan:

- Imports at top (lines ~12-25)
- Two functions before default export
- Default export `ArtistDetailPage` returns a `<div className="max-w-7xl ...">` with breadcrumb + a `<div className="grid grid-cols-1 lg:grid-cols-12 ...">`
- The grid has two children: `<div className="lg:col-span-5">...</div>` (portrait) and `<div className="lg:col-span-7 ...">...</div>` (info)
- The portrait column contains `<FlyerImage ... />` inside a sticky div
- The info column contains: Eyebrow → h1 → bio → genres → SocialLinks → photo gallery section (restored by PR #56) → upcoming events

- [ ] **Step 2: Add imports for the new components**

Find the existing imports block and add:

```tsx
import ImageLightboxRoot, { type ImageEntry } from "@/components/ui/ImageLightboxRoot"
import ImageLightboxTrigger from "@/components/ui/ImageLightboxTrigger"
```

- [ ] **Step 3: Build the `images` array inside the default export**

Just before the `return (` of `ArtistDetailPage`, after `const eyebrowText = ...`, add:

```tsx
  // Array unificado para el lightbox: cover en index 0, gallery thumbs
  // a partir de index 1. Cada trigger conoce su índice (0 para la
  // portrait, i+1 para el thumb i de `images.slice(1)`).
  const lightboxImages: ImageEntry[] = artist.images.map((img) => ({
    src: img.url,
    alt: img.alt ?? artist.name,
  }))
```

- [ ] **Step 4: Wrap the entire grid in `<ImageLightboxRoot>`**

Find the JSX `<div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">` and wrap it:

```tsx
      <ImageLightboxRoot images={lightboxImages}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
          {/* ... existing children ... */}
        </div>
      </ImageLightboxRoot>
```

Make sure the closing `</ImageLightboxRoot>` matches the existing closing `</div>` of the grid.

- [ ] **Step 5: Wrap the portrait `<FlyerImage>` in a trigger**

Find this block (currently lines ~102-112):

```tsx
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--layout-header-h)+24px)]">
            <FlyerImage
              publicId={artist.coverImagePublicId ?? undefined}
              src={artist.coverImage ?? undefined}
              alt={artist.coverImageAlt ?? artist.name}
              aspectRatio="4:5"
              fallbackAccent={fallbackAccent}
              priority
            />
          </div>
        </div>
```

Replace the inner `<FlyerImage />` block with a trigger wrapping it. Skip the wrap (just leave `<FlyerImage />` as-is) if there are no images, to avoid an empty lightbox:

```tsx
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--layout-header-h)+24px)]">
            {lightboxImages.length > 0 ? (
              <ImageLightboxTrigger
                index={0}
                ariaLabel={t("openImage", { index: 1, total: lightboxImages.length })}
                className="block"
              >
                <FlyerImage
                  publicId={artist.coverImagePublicId ?? undefined}
                  src={artist.coverImage ?? undefined}
                  alt={artist.coverImageAlt ?? artist.name}
                  aspectRatio="4:5"
                  fallbackAccent={fallbackAccent}
                  priority
                />
              </ImageLightboxTrigger>
            ) : (
              <FlyerImage
                publicId={artist.coverImagePublicId ?? undefined}
                src={artist.coverImage ?? undefined}
                alt={artist.coverImageAlt ?? artist.name}
                aspectRatio="4:5"
                fallbackAccent={fallbackAccent}
                priority
              />
            )}
          </div>
        </div>
```

- [ ] **Step 6: Switch the trigger label key from `artistDetail` to `lightbox`**

The page already does `const t = await getTranslations({ locale, namespace: "artistDetail" })`. We need `openImage` from the `lightbox` namespace. Add a second translator:

Find:
```tsx
  const t = await getTranslations({ locale, namespace: "artistDetail" })
```

Add right after:
```tsx
  const tLightbox = await getTranslations({ locale, namespace: "lightbox" })
```

Then in Step 5's snippet, replace `t("openImage", ...)` with `tLightbox("openImage", ...)`. The cover trigger ariaLabel becomes:

```tsx
ariaLabel={tLightbox("openImage", { index: 1, total: lightboxImages.length })}
```

- [ ] **Step 7: Wrap each gallery thumb in a trigger**

Find the gallery section that PR #56 restored:

```tsx
          {artist.images.length > 1 ? (
            <section className="flex flex-col gap-m">
              <Eyebrow as="h2">{t("photosLabel")}</Eyebrow>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-s">
                {artist.images.slice(1).map((img) => (
                  <li
                    key={img.id}
                    className="relative aspect-square overflow-hidden rounded-lg bg-bg-surface-2"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt ?? artist.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
```

Refactor to move the styling onto the trigger and pass the index. `images.slice(1)` items map to lightbox indices `1..N-1`; use the second arg of `.map` (the source array index) + 1 to compute the lightbox index:

```tsx
          {artist.images.length > 1 ? (
            <section className="flex flex-col gap-m">
              <Eyebrow as="h2">{t("photosLabel")}</Eyebrow>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-s">
                {artist.images.slice(1).map((img, i) => {
                  // `i` is 0-based within `slice(1)`. The slide in the
                  // lightbox is at index `i + 1` (cover is 0). Display
                  // label is 1-based: `i + 2`.
                  const lightboxIndex = i + 1
                  return (
                    <li key={img.id}>
                      <ImageLightboxTrigger
                        index={lightboxIndex}
                        ariaLabel={tLightbox("openImage", {
                          index: lightboxIndex + 1,
                          total: lightboxImages.length,
                        })}
                        className="relative aspect-square overflow-hidden rounded-lg bg-bg-surface-2"
                      >
                        <Image
                          src={img.url}
                          alt={img.alt ?? artist.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
                          className="object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </ImageLightboxTrigger>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}
```

- [ ] **Step 8: TS check + build**

Run: `pnpm exec tsc --noEmit`
Expected: `TypeScript: No errors found`.

Run: `pnpm run build 2>&1 | tail -20`
Expected: build succeeds without errors. There should be ƒ entries for `/[locale]/(public)/artists/[slug]` in the build output.

- [ ] **Step 9: Visual sanity in dev**

Start dev server in a separate terminal (background): `pnpm dev`
Wait until "Ready in N ms" appears.

Open `http://localhost:3000/es/artists/<any-existing-slug>` in a browser. Check:
- Portrait click → lightbox opens at the cover.
- Counter shows "1 / N" in a corner.
- Caption shows the alt text (if any).
- Click next/prev arrows → cycles through images.
- `Esc` closes.
- Gallery section (if there are >1 photos): each thumb click opens lightbox at the correct slide.
- Mouse-hover on portrait shows `cursor: zoom-in` cursor.

If any of the above fails, fix before committing.

Stop the dev server.

- [ ] **Step 10: Commit**

```bash
git add src/app/[locale]/(public)/artists/[slug]/page.tsx
git commit -S -m "feat(artists): click-to-lightbox on portrait + gallery thumbs

Wires the lightbox into the artist detail page. The 12-col grid is
wrapped in <ImageLightboxRoot> so triggers in either column share
state. The portrait (col-5) and each gallery thumb (col-7) becomes
an <ImageLightboxTrigger>. Cover is index 0, gallery items are 1..N-1.

If the artist has zero images (legacy case), the portrait renders
its fallback (initials over accent bg) outside the trigger to avoid
an empty lightbox."
```

---

## Task 5: Wire up `/events/[slug]/page.tsx` + add new gallery

**Files:**
- Modify: `src/app/[locale]/(public)/events/[slug]/page.tsx`

- [ ] **Step 1: Read the current file**

Use `Read` on `src/app/[locale]/(public)/events/[slug]/page.tsx` to refresh exact content. Layout summary:

- Imports at top
- Helper functions (`formatEventDateLong`, `extractTimeRange`, `extractCity`)
- Default export `EventDetailPage` returns `<div className="max-w-7xl ...">` with breadcrumb + `<div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">`
- Left column: `<div className="lg:col-span-5">` with sticky `<FlyerImage ... />`
- Right column: `<div className="lg:col-span-7 ...">` with eyebrow chips, header (h1 + byline + artist), `<FactGrid>`, `<EventAccessCTA>`, About section, MoreDates section, OtherEvents section

We need: wrap grid in Root, wrap hero in Trigger, add new Fotos section between About and MoreDates, wrap each new thumb in Trigger.

- [ ] **Step 2: Add imports**

Add to the imports block:

```tsx
import Image from "next/image"
import ImageLightboxRoot, { type ImageEntry } from "@/components/ui/ImageLightboxRoot"
import ImageLightboxTrigger from "@/components/ui/ImageLightboxTrigger"
```

(`next/image` is for the new gallery thumbs.)

- [ ] **Step 3: Get the lightbox translator**

In `EventDetailPage`, find:
```tsx
  const t = await getTranslations({ locale, namespace: "eventDetail" })
```

Add right after:
```tsx
  const tLightbox = await getTranslations({ locale, namespace: "lightbox" })
```

- [ ] **Step 4: Build the `images` array**

Inside `EventDetailPage`, after the `isLive` block (right before `return (`), add:

```tsx
  // Array unificado para el lightbox: cover en index 0, thumbs nuevos
  // en index 1..N-1. Misma estructura que en /artists/[slug].
  const lightboxImages: ImageEntry[] = event.images.map((img) => ({
    src: img.url,
    alt: img.alt ?? event.title,
  }))
```

**Note:** `event.images` exists on `EventDetail` per `src/services/events.ts` (Prisma include already brings all images, ordered by EventImage row). Verify it's typed; if not, fall back to a defensive `(event.images ?? [])`.

- [ ] **Step 5: Wrap the grid in `<ImageLightboxRoot>`**

Find the grid:
```tsx
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
```

Wrap it the same way as in artist:

```tsx
        <ImageLightboxRoot images={lightboxImages}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
            {/* ... existing children ... */}
          </div>
        </ImageLightboxRoot>
```

- [ ] **Step 6: Wrap the hero `<FlyerImage>` in a trigger**

Find:

```tsx
          {/* Columna izquierda: flyer sticky */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--layout-header-h)+24px)]">
              <FlyerImage
                publicId={event.coverImagePublicId ?? undefined}
                src={event.coverImage ?? undefined}
                alt={event.coverImageAlt ?? event.title}
                aspectRatio="4:5"
                fallbackAccent={fallbackAccent}
                priority
              />
            </div>
          </div>
```

Replace the inner FlyerImage block with the conditional trigger (same pattern as artist):

```tsx
          {/* Columna izquierda: flyer sticky */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--layout-header-h)+24px)]">
              {lightboxImages.length > 0 ? (
                <ImageLightboxTrigger
                  index={0}
                  ariaLabel={tLightbox("openImage", { index: 1, total: lightboxImages.length })}
                  className="block"
                >
                  <FlyerImage
                    publicId={event.coverImagePublicId ?? undefined}
                    src={event.coverImage ?? undefined}
                    alt={event.coverImageAlt ?? event.title}
                    aspectRatio="4:5"
                    fallbackAccent={fallbackAccent}
                    priority
                  />
                </ImageLightboxTrigger>
              ) : (
                <FlyerImage
                  publicId={event.coverImagePublicId ?? undefined}
                  src={event.coverImage ?? undefined}
                  alt={event.coverImageAlt ?? event.title}
                  aspectRatio="4:5"
                  fallbackAccent={fallbackAccent}
                  priority
                />
              )}
            </div>
          </div>
```

- [ ] **Step 7: Add the new "Fotos" gallery section**

Find the About section in the right column:

```tsx
            {/* About */}
            {event.description ? (
              <section className="flex flex-col gap-s">
                <Eyebrow as="h2">{t("about")}</Eyebrow>
                <p className="text-body text-fg-primary leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </section>
            ) : null}
```

Insert the new gallery section directly after it, before the MoreDates section:

```tsx
            {/* Galería de fotos — mirror del patrón de artist. Cover ya
                renderizada como flyer arriba; la galería empieza en
                event.images[1] para no duplicar. Misma grid 2/3 cols. */}
            {event.images.length > 1 ? (
              <section className="flex flex-col gap-m">
                <Eyebrow as="h2">{t("photosLabel")}</Eyebrow>
                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-s">
                  {event.images.slice(1).map((img, i) => {
                    const lightboxIndex = i + 1
                    return (
                      <li key={img.id}>
                        <ImageLightboxTrigger
                          index={lightboxIndex}
                          ariaLabel={tLightbox("openImage", {
                            index: lightboxIndex + 1,
                            total: lightboxImages.length,
                          })}
                          className="relative aspect-square overflow-hidden rounded-lg bg-bg-surface-2"
                        >
                          <Image
                            src={img.url}
                            alt={img.alt ?? event.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
                            className="object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </ImageLightboxTrigger>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}
```

- [ ] **Step 8: TS check + build**

Run: `pnpm exec tsc --noEmit`
Expected: `TypeScript: No errors found`.

If you get an error about `event.images` not existing on `EventDetail`, open `src/services/events.ts` and confirm `EventDetail` interface includes `images: { id: string; url: string; alt: string | null; publicId: string }[]`. It should — the artist detail interface already has it. If missing, this is a separate scope issue; abort and report.

Run: `pnpm run build 2>&1 | tail -20`
Expected: build succeeds.

- [ ] **Step 9: Visual sanity in dev**

Start dev server: `pnpm dev`
Open `http://localhost:3000/es/events/<any-event-slug-with-multiple-photos>`. Check:
- Hero flyer click → lightbox opens at the cover.
- New "Fotos" section appears between About and MoreDates (only if event has >1 photo).
- Thumbs are 2 cols on mobile, 3 cols `sm+`, aspect-square.
- Thumb click → lightbox opens at correct slide.
- Counter, captions, zoom, thumbnails strip all work.
- Mobile swipe between slides works.
- Locales: open `http://localhost:3000/en/events/<slug>` and `/de/events/<slug>` — close/next/previous labels are English/German.

Stop the dev server.

- [ ] **Step 10: Commit**

```bash
git add src/app/[locale]/(public)/events/[slug]/page.tsx
git commit -S -m "feat(events): gallery section + click-to-lightbox on hero & thumbs

- Adds a 'Fotos' section between About and MoreDates, rendering
  event.images.slice(1) in a 2/3-col grid (mirror of artist).
- Wraps the 12-col grid in <ImageLightboxRoot> with all images,
  cover at index 0.
- Hero flyer (col-5) and each gallery thumb (col-7) become
  <ImageLightboxTrigger>s.
- Falls back to plain <FlyerImage> when event has zero images, so
  the trigger never wraps an empty lightbox.

Closes the regression-not-quite (events never had a public gallery
in git history, this is the first version) raised after PR #56."
```

---

## Task 6: Pre-push verification + push + PR

**Files:** none

- [ ] **Step 1: Final TS + build**

Run: `pnpm exec tsc --noEmit`
Expected: clean.

Run: `pnpm run build 2>&1 | tail -10`
Expected: build succeeds.

- [ ] **Step 2: Run pre-push rigor checklist**

Walk through `~/.claude/projects/-Users-kilo-desarrollo26-lahuelladelcaminante/memory/feedback_pre_push_rigor.md` against this PR's diff (`git diff main..HEAD`). Specifically verify:

- **#6 i18n counts/plurals**: `openImage` uses `{index}/{total}` interpolation — both numeric, no pluralisation needed. ✓
- **#7 i18n aria/alt**: every `ImageLightboxTrigger` has `ariaLabel` from `tLightbox`. ✓
- **#8 ES voseo**: "Cerrar", "Siguiente", "Anterior", "Abrir foto" — no imperatives with clíticos, no tildes needed.
- **#9 DE strings**: "Schließen" (infinitive, normal), "Weiter", "Zurück", "öffnen" — declensions OK.
- **i18n key parity**: same set of keys in es/en/de. Run:
  ```bash
  node -e "
  const fs=require('fs');
  ['es','en','de'].forEach(l=>{const d=JSON.parse(fs.readFileSync('src/messages/'+l+'.json','utf8'));console.log(l,'lightbox keys:',Object.keys(d.lightbox).sort().join(','));console.log(l,'photosLabel:',d.eventDetail?.photosLabel)});
  "
  ```
  Expected: same key sets across all 3 locales; `photosLabel` non-empty in all 3.

- [ ] **Step 3: Push branch**

```bash
git push -u origin feat/image-lightbox
```

If push fails with "agent refused operation", ask the user to unlock Bitwarden and retry.

- [ ] **Step 4: Open the PR**

```bash
gh pr create --base main --head feat/image-lightbox \
  --title "feat(lightbox): click-to-carousel on artist + event detail pages" \
  --body "$(cat <<'EOF'
## Summary
- Every public image on \`/artists/[slug]\` and \`/events/[slug]\` is now clickable, opening a fullscreen lightbox/carousel that cycles through all images on the page.
- Adds a new "Fotos" gallery section to event detail (mirror of the artist gallery restored in #56).
- Library: \`yet-another-react-lightbox\` with Counter / Captions / Zoom / Thumbnails plugins.

## Architecture
- 2 new client components: \`ImageLightboxRoot\` (context + lightbox UI) and \`ImageLightboxTrigger\` (button wrapper).
- Server pages build the unified \`images[]\` array from the existing Prisma include; cover is index 0, gallery thumbs are 1..N-1.
- No schema changes, no migrations.

## i18n
- New \`lightbox\` namespace in es/en/de (close/next/previous/openImage).
- New \`eventDetail.photosLabel\` in es/en/de.

## Spec / Plan
- Spec: \`docs/superpowers/specs/2026-05-27-image-lightbox-design.md\`
- Plan: \`docs/superpowers/plans/2026-05-27-image-lightbox.md\`

## Test plan
- [ ] \`/es/artists/<slug>\` — portrait click opens lightbox at index 0; gallery thumb #i opens at index i+1
- [ ] \`/es/events/<slug>\` — hero click opens lightbox at index 0; new gallery section shows when event has >1 photo; thumb #i opens at index i+1
- [ ] Lightbox: counter, captions, zoom, thumbnails strip all functional
- [ ] Keyboard: ←/→/Esc work
- [ ] Mobile swipe navigates
- [ ] EN + DE locales show translated close/next/previous labels and \`aria-label\`s
- [ ] No layout shift introduced by trigger \`<button>\` wrappers
- [ ] No console warnings
EOF
)"
```

- [ ] **Step 5: Wait for CodeRabbit**

Per project policy (`feedback_wait_for_codereview.md`), do NOT propose merge until CodeRabbit reviews the latest commit. The user can either:
1. Wait ~5-10 min and check via `gh pr view <N>`, or
2. Ask Claude to monitor with `fijate los comentarios` later.

Stop here. The plan does NOT include merge or deploy — those happen interactively with the user after CR.

---

## Self-Review Notes

**Spec coverage check:**
- Event gallery section → Task 5 Step 7 ✓
- All public images clickable → Tasks 4 + 5 ✓
- yet-another-react-lightbox + 4 plugins → Task 1 + Task 2 ✓
- Provider + Trigger arch → Tasks 2 + 3 ✓
- i18n new namespace + photosLabel → Task 1 ✓
- Cover at index 0, gallery at index+1 → Tasks 4 Step 7 + 5 Step 7 ✓
- aria-label with 1-based display → Tasks 4 Step 7 + 5 Step 7 ✓
- Acceptance criteria → Task 4 Step 9 + Task 5 Step 9 + Task 6 Step 2 ✓
- Out-of-scope (creators) → no task touches creators ✓

**Type consistency check:**
- `ImageEntry` defined in Task 2, used in Tasks 4-5 ✓
- `useImageLightbox()` hook returns `{ open }`, consumed in Task 3 ✓
- Trigger props (`index`, `ariaLabel`, `className`, `children`) match between Task 3 definition and Tasks 4-5 usage ✓
- `tLightbox("openImage", { index, total })` arg names match the JSON key interpolation in Task 1 ✓
