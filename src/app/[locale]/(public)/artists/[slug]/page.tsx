/**
 * `/artists/[slug]` — detalle de artista.
 *
 * Layout 5+7 desktop: portrait sticky a la izquierda, info a la derecha.
 * Mobile: portrait full-width arriba, info debajo. La bio se renderiza
 * como texto plano por ahora — TODO: parser markdown básico (bold/italic/
 * link) cuando lo necesitemos.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §3 "Artista · detalle".
 */

import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { getArtistBySlug } from "@/services/artists"
import { getUpcomingEventsByArtist } from "@/services/events"
import { genreAccent } from "@/lib/genre-accent"
import { getCloudinaryUrl } from "@/lib/cloudinary-url"
import { ArrowLeft } from "lucide-react"
import Chip from "@/components/ui/Chip"
import Eyebrow from "@/components/ui/Eyebrow"
import FlyerImage from "@/components/ui/FlyerImage"
import ImageLightboxRoot, { type ImageEntry } from "@/components/ui/ImageLightboxRoot"
import ImageLightboxTrigger from "@/components/ui/ImageLightboxTrigger"
import SocialLinks from "@/components/artists/SocialLinks"
import { EventCard } from "@/components/events/EventCard"

function originEyebrow(genres: string[], origin: string | null): string | null {
  const parts: string[] = []
  if (genres[0]) parts.push(genres[0].toUpperCase())
  if (origin) parts.push(origin.toUpperCase())
  return parts.length > 0 ? parts.join(" · ") : null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const tCommon = await getTranslations({ locale, namespace: "common" })
  const artist = await getArtistBySlug(slug)
  if (!artist) {
    return { title: `${tCommon("notFound")} · La Huella del Caminante` }
  }

  const description = [
    artist.name,
    artist.origin,
    artist.genres.length > 0 ? artist.genres.join(", ") : null,
  ]
    .filter(Boolean)
    .join(" — ")

  // Cascada de fallback: Cloudinary → URL plana → sin imagen. Ver
  // comentario equivalente en `/events/[slug]/page.tsx`.
  const ogUrl =
    (artist.coverImagePublicId && getCloudinaryUrl(artist.coverImagePublicId)) ??
    artist.coverImage
  const images = ogUrl ? [{ url: ogUrl }] : []

  return {
    title: `${artist.name} · La Huella del Caminante`,
    description,
    openGraph: {
      title: artist.name,
      description: artist.bio?.slice(0, 160) ?? description,
      images,
    },
  }
}

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const artist = await getArtistBySlug(slug)
  if (!artist) notFound()

  const t = await getTranslations({ locale, namespace: "artistDetail" })
  const tLightbox = await getTranslations({ locale, namespace: "lightbox" })
  const upcomingEvents = await getUpcomingEventsByArtist(artist.id)

  const accent = genreAccent(artist.genres[0])
  const fallbackAccent = accent === "neutral" ? "creator" : accent
  const eyebrowText = originEyebrow(artist.genres, artist.origin)
  const resolvedLocale = locale

  // Array unificado para el lightbox: cover en index 0, gallery thumbs
  // a partir de index 1. Cada trigger conoce su índice (0 para la
  // portrait, i+1 para el thumb i de `images.slice(1)`).
  //
  // INVARIANTE: hero y `lightboxImages[0]` apuntan al MISMO image físico.
  // El service (`getArtistBySlug` en `services/artists.ts`) deriva
  // `coverImage = images[0].url` y `coverImageAlt = images[0].alt`, así que
  // el `<FlyerImage>` del hero y el slide 0 del lightbox renderizan
  // exactamente la misma imagen. El hero usa el campo `coverImagePublicId`
  // adicional para activar el path de `<CldImage>` con transformaciones
  // Cloudinary (mejor rendering del flyer grande); el lightbox alcanza
  // con la URL plana.
  const lightboxImages: ImageEntry[] = artist.images.map((img) => ({
    src: img.url,
    alt: img.alt ?? artist.name,
  }))

  // Mismo FlyerImage en ambas ramas del conditional de abajo — extraído
  // a una const para evitar drift si se agregan/cambian props.
  const portrait = (
    <FlyerImage
      publicId={artist.coverImagePublicId ?? undefined}
      src={artist.coverImage ?? undefined}
      alt={artist.coverImageAlt ?? artist.name}
      aspectRatio="4:5"
      fallbackAccent={fallbackAccent}
      priority
    />
  )

  return (
    <div className="max-w-7xl mx-auto px-m sm:px-l py-l lg:py-xl">
      {/* Breadcrumb */}
      <Link
        href="/artists"
        className="inline-flex items-center gap-xs text-body-s text-fg-secondary hover:text-fg-primary transition-colors mb-l"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden />
        <span>{t("backToArtists")}</span>
      </Link>

      <ImageLightboxRoot images={lightboxImages}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
          {/* Portrait sticky */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--layout-header-h)+24px)]">
              {lightboxImages.length > 0 ? (
                <ImageLightboxTrigger
                  index={0}
                  ariaLabel={tLightbox("openImage", { index: 1, total: lightboxImages.length })}
                >
                  {portrait}
                </ImageLightboxTrigger>
              ) : (
                portrait
              )}
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-7 flex flex-col gap-l">
            {eyebrowText ? <Eyebrow>{eyebrowText}</Eyebrow> : null}

            <h1 className="text-heading-l sm:text-display-m font-display text-fg-primary leading-tight">
              {artist.name}
            </h1>

            {/* Bio (texto plano por ahora — TODO: markdown básico bold/italic/link) */}
            {artist.bio ? (
              <p className="text-body-l text-fg-primary leading-relaxed whitespace-pre-line max-w-2xl">
                {artist.bio}
              </p>
            ) : null}

            {/* Géneros */}
            {artist.genres.length > 0 ? (
              <ul className="flex flex-wrap gap-xs">
                {artist.genres.map((g) => {
                  const a = genreAccent(g)
                  return (
                    <li key={g}>
                      <Chip accent={a === "neutral" ? "creator" : a} active size="s">
                        {g}
                      </Chip>
                    </li>
                  )
                })}
              </ul>
            ) : null}

            {/* Redes sociales */}
            <SocialLinks socialMedia={artist.socialMedia} />

            {/*
              Galería de fotos — restaura la sección que el redesign (commit
              6e18e53) borró sin querer. Datos y forms de upload nunca se
              tocaron; solo faltaba el render.

              `images[0]` ya se renderiza como portrait grande arriba, así
              que la galería empieza desde `images[1]` para no duplicar.
              El grid responsive (2 cols mobile, 3 cols sm+) cabe bien
              dentro del col-span-7 del layout.
            */}
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

            {/* Próximas fechas */}
            <section className="flex flex-col gap-m">
              <Eyebrow as="h2">{t("upcomingShows")}</Eyebrow>
              {upcomingEvents.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-m">
                  {upcomingEvents.map((ev) => (
                    <li key={ev.id}>
                      <EventCard event={ev} locale={resolvedLocale} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body text-fg-secondary">{t("noUpcomingShows")}</p>
              )}
            </section>
          </div>
        </div>
      </ImageLightboxRoot>
    </div>
  )
}
