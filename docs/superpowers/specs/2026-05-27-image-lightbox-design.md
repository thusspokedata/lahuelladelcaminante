# Image Lightbox / Carousel — Design

**Status:** Approved · Ready for implementation plan
**Date:** 2026-05-27
**Scope:** Single PR. ~250 lines net.

## Problem

Today, public detail pages (`/artists/[slug]`, `/events/[slug]`) render images as static blocks:
- **Artists** show the cover as a large portrait + a gallery grid of additional photos (restored in PR #56).
- **Events** show only the cover/hero flyer — no gallery, even though the data layer supports `event.images[]` and the dashboard form already accepts multi-upload.

Users have no way to view photos at full size or browse them as a sequence. Flyers in particular often contain text (artist names, schedule, addresses) that is unreadable at thumbnail scale.

## Goals

1. Add a public gallery section to event detail (mirror the pattern just restored on artist).
2. Make **every public image** on detail pages clickable to open a fullscreen lightbox/carousel.
3. The lightbox shows one image at a time at large size, with navigation between all images on the page (cover + gallery).

## Non-goals

- Creator profiles (`/creators/[slug]`): no images in the data model yet. Out of scope; revisit if/when a `UserProfile.images` relation is added.
- Listing pages (`/artists`, `/events`): the card thumbnails on these pages already link to detail. No lightbox there.
- Image upload/editing changes: dashboard forms already work; this is render-only.

## User-facing behaviour

### Detail page additions

**Event detail (`/events/[slug]`)** gains a "Fotos" section, inserted between **About** and **MoreDates**, rendering `event.images.slice(1)` (skip cover, since cover is shown big in the left column). Same visual pattern as the restored artist gallery:
- Hidden if `event.images.length <= 1`.
- Grid: 2 columns mobile, 3 columns `sm+`, aspect-square, `object-cover`, hover `scale-105`.
- Heading uses the design system's `Eyebrow as="h2"`.

### Click → lightbox

Every public image on a detail page is wrapped in a clickable button:

| Page | Trigger | Lightbox opens at index |
|---|---|---|
| Artist detail | Portrait (left col) | 0 |
| Artist detail | Gallery thumb #i | i + 1 |
| Event detail | Hero flyer (left col) | 0 |
| Event detail | Gallery thumb #i (new) | i + 1 |

The lightbox cycles through **all images on that page** (cover + gallery), not just the gallery thumbnails. So clicking the cover opens the lightbox at the cover; clicking thumb #0 opens at index 1; ← / → arrows navigate the full set.

### Lightbox features

Four plugins from `yet-another-react-lightbox` enabled:

- **Counter** — "1/5" indicator in a corner.
- **Captions** — alt text shown below the image. Hidden if alt is empty.
- **Zoom** — pinch on mobile, scroll-wheel on desktop. Useful for reading text on flyers.
- **Thumbnails** — strip of small previews at the bottom; click to jump.

### Keyboard, gestures, accessibility (library defaults)

- `←` / `→`: navigate
- `Esc`: close
- Mobile swipe: navigate
- Focus is trapped inside the lightbox while open
- Triggers are `<button type="button">` so they're keyboard-accessible and announced correctly to screen readers
- `aria-label` on each trigger: `"Abrir foto N de TOTAL"` (locale-translated, see i18n below)

## Architecture

### Components

Two new client components live under `src/components/ui/`:

#### `ImageLightboxRoot.tsx`

Wraps a section of the page and provides lightbox state + the actual `<Lightbox>` UI.

```ts
interface ImageEntry {
  src: string
  alt: string
}

interface ImageLightboxRootProps {
  images: ImageEntry[]
  children: React.ReactNode
}
```

Responsibilities:
- Holds `{ open: boolean; index: number }` state.
- Exposes via React context: `open(index: number) => void`, `close() => void`.
- Renders `yet-another-react-lightbox`'s `<Lightbox>` configured with the four plugins (Counter, Captions, Zoom, Thumbnails).
- Renders `children` (the rest of the page section) inside the context provider.
- `"use client"` directive at top.

#### `ImageLightboxTrigger.tsx`

Wraps any image-rendering JSX in a `<button>` that opens the lightbox at a given index.

```ts
interface ImageLightboxTriggerProps {
  index: number
  ariaLabel: string
  className?: string
  children: React.ReactNode
}
```

Responsibilities:
- Reads `open(index)` from context.
- Renders `<button type="button" onClick={() => open(index)} aria-label={ariaLabel} className={className}>{children}</button>`.
- Default styling: `block w-full appearance-none cursor-zoom-in` (overridable via `className`).
- `"use client"` directive at top.

### Why provider + trigger (not inline state per page)

The cover/hero and the gallery grid live in **different columns** of the same 12-column layout (`lg:col-span-5` vs `lg:col-span-7`). They need to share lightbox state without passing handlers across the layout boundary. React context resolves this cleanly:

- Server page builds the `images` array once.
- A single `ImageLightboxRoot` wraps the entire 12-col grid.
- Each clickable image becomes a `ImageLightboxTrigger` with its index.

This keeps the server page declarative and avoids prop drilling.

### Data flow

The server page constructs `images` directly from the Prisma include's `images` relation:

```ts
const images: ImageEntry[] = artist.images.map((img) => ({
  src: img.url,
  alt: img.alt ?? artist.name,
}))
```

`img.url` is the full Cloudinary URL stored at upload time — high resolution, no extra transformation needed at this stage. If we later need explicit max-width (1920px etc.), it goes inside `ImageLightboxRoot` using the existing `getCloudinaryUrl()` helper.

## File changes

### New files
- `src/components/ui/ImageLightboxRoot.tsx`
- `src/components/ui/ImageLightboxTrigger.tsx`

### Modified files
- `src/app/[locale]/(public)/artists/[slug]/page.tsx` — wrap portrait + gallery items in `<ImageLightboxTrigger>`, wrap the 12-col grid in `<ImageLightboxRoot>`.
- `src/app/[locale]/(public)/events/[slug]/page.tsx` — add gallery section + wrap hero + gallery items, wrap the 12-col grid in `<ImageLightboxRoot>`.
- `src/messages/{es,en,de}.json` — new keys (see i18n below).
- `package.json` / `package-lock.json` — add `yet-another-react-lightbox` dependency.

## i18n

### `eventDetail` namespace (es/en/de)
- `photosLabel`: "Fotos" / "Photos" / "Fotos"

### New `lightbox` namespace (es/en/de)
- `close`: "Cerrar" / "Close" / "Schließen"
- `next`: "Siguiente" / "Next" / "Weiter"
- `previous`: "Anterior" / "Previous" / "Zurück"
- `openImage`: `"Abrir foto {index} de {total}"` / `"Open photo {index} of {total}"` / `"Foto {index} von {total} öffnen"`

The `openImage` key is used for the `aria-label` on each `<ImageLightboxTrigger>`. ICU interpolation with `{index}` (1-based for user display: 1, 2, 3…) and `{total}` (length of `images[]`) — both numeric, no pluralisation needed. The server page calls `t("openImage", { index: triggerIndex + 1, total: images.length })` when building each trigger's label; the `index` prop on the trigger component remains 0-based internally to match the lightbox library's API.

The lightbox library's internal `labels` prop is fed the `close`/`next`/`previous` translations.

## Dependencies

```shell
pnpm add yet-another-react-lightbox
```

The package bundles the four plugins we use; no separate install required. Bundle impact: ~30 KB for core + ~3-5 KB per plugin enabled (gzipped). React 19 / Next 16 supported per the library's README.

## Risks and decisions

| Decision | Choice | Alternative considered |
|---|---|---|
| Library vs custom | `yet-another-react-lightbox` | PhotoSwipe (more weight, more setup); fully custom (more accessibility burden) |
| State model | Context (provider + trigger) | Inline `useState` per page (defeated by cover/gallery being in different columns) |
| Image source URL | Use `img.url` directly | Apply Cloudinary transformations (defer until needed; current URLs are already high-quality) |
| Cover clickable too? | Yes (consistent UX) | Only thumbnails (rejected by user — they want all images clickable) |
| Plugins enabled | Counter + Captions + Zoom + Thumbnails | Each was opted in explicitly during brainstorming |
| Scope | Artist + Event in one PR | Two sequential PRs (rejected — same pattern, no shared-state risk) |
| Creator profile gallery | Out of scope | Schema would need `UserProfile.images` relation; separate effort |

## Out of scope (explicit list to prevent scope creep)

- Adding `images` to `UserProfile` / `/creators/[slug]` gallery
- Changing dashboard image upload UI
- Cloudinary transformation tuning (size/quality params)
- Image preloading / blurhash placeholders
- Slideshow / autoplay mode
- Social share buttons inside the lightbox
- Alt-text inline editing on the public side

## Acceptance criteria

- [ ] `/es/artists/[slug]` (and en/de) — portrait click opens lightbox at index 0
- [ ] `/es/artists/[slug]` — gallery thumb #i click opens lightbox at index i+1
- [ ] `/es/events/[slug]` — hero click opens lightbox at index 0
- [ ] `/es/events/[slug]` — new gallery section visible when `event.images.length > 1`
- [ ] `/es/events/[slug]` — gallery thumb #i click opens lightbox at index i+1
- [ ] Lightbox: counter shows "N/total"; captions show alt text; zoom works on flyer with small text; thumbnails strip navigates correctly
- [ ] Keyboard: ←/→/Esc all work
- [ ] Mobile swipe navigates
- [ ] Triggers have `aria-label` localised in es/en/de
- [ ] No console warnings about React/Cloudinary
- [ ] No layout shift introduced by the trigger `<button>` wrapper
- [ ] Build passes; tsc clean; no new lint warnings
