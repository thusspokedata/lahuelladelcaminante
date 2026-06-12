/**
 * `/events/[slug]` — detalle de evento.
 *
 * Layout 5+7 desktop (flyer sticky a la izquierda, info a la derecha) y
 * stack vertical en mobile con `EventAccessCTA` adicional fijado al fondo
 * vía `StickyCTABar`. Estructura del bloque de info: breadcrumb, eyebrow
 * con chips, h1, artista vinculado, fact grid 2×2, CTA contextual, bloque
 * "sobre el show", más fechas (si hay), otros shows del artista (si hay).
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §3 "Evento · detalle".
 */

import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { getEventBySlug, getOtherEventsByArtist } from "@/services/events"
import { genreAccent } from "@/lib/genre-accent"
import { getCloudinaryUrl } from "@/lib/cloudinary-url"
import { ArrowLeft } from "lucide-react"
import Chip from "@/components/ui/Chip"
import Eyebrow from "@/components/ui/Eyebrow"
import FactGrid from "@/components/ui/FactGrid"
import FlyerImage from "@/components/ui/FlyerImage"
import ImageLightboxRoot, { type ImageEntry } from "@/components/ui/ImageLightboxRoot"
import ImageLightboxTrigger from "@/components/ui/ImageLightboxTrigger"
import StickyCTABar from "@/components/ui/StickyCTABar"
import { EventCard } from "@/components/events/EventCard"
import EventAccessCTA from "@/components/events/EventAccessCTA"

/** Formatea "Lun 7 jun · 19:30" (o equivalente por locale). Vacío si no hay
 * date o la date es inválida. Replica el patrón de `EventCard` para
 * consistencia visual entre la card y el detalle. */
const LOCALE_MAP: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  de: "de-DE",
}

function formatEventDateLong(
  date: Date | null,
  time: string | null,
  locale: string
): string {
  if (!date) return ""
  const intl = new Intl.DateTimeFormat(LOCALE_MAP[locale] ?? "es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const label = intl.format(date).replace(/\./g, "")
  return time ? `${label} · ${time}` : label
}

/** "19:30 — 23:00" si tenemos campo `time` con rango; null si solo hay hora
 * de inicio o nada. Por ahora `Event.time` es string libre — si el creator
 * escribe "19:30 - 23:00" lo mostramos tal cual; si escribe solo "19:30",
 * `null` (el dato ya va en el fact "CUÁNDO" como sufijo). */
function extractTimeRange(time: string | null): string | null {
  if (!time) return null
  const trimmed = time.trim()
  return /[-—–]/.test(trimmed) ? trimmed : null
}

function extractCity(location: string): string {
  const parts = location.split(",").map((s) => s.trim())
  return parts[parts.length - 1] ?? location
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const tCommon = await getTranslations({ locale, namespace: "common" })
  const event = await getEventBySlug(slug)
  if (!event) {
    return { title: `${tCommon("notFound")} · La Huella del Caminante` }
  }

  const nextDate = event.dates[0] ?? null
  const description = [
    event.title,
    extractCity(event.location),
    nextDate
      ? new Intl.DateTimeFormat(LOCALE_MAP[locale] ?? "es-ES", {
          day: "numeric",
          month: "long",
        }).format(nextDate)
      : null,
    event.location,
  ]
    .filter(Boolean)
    .join(" · ")

  // Cascada de fallback: Cloudinary (transformaciones OG) → URL plana del
  // cover → sin imagen. Si el cloud name no está configurado o no hay
  // publicId, todavía podemos usar la URL plana en `event.coverImage`.
  const ogUrl =
    (event.coverImagePublicId && getCloudinaryUrl(event.coverImagePublicId)) ??
    event.coverImage
  const images = ogUrl ? [{ url: ogUrl }] : []

  return {
    title: `${event.title} · La Huella del Caminante`,
    description,
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160) ?? description,
      images,
    },
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) notFound()

  const t = await getTranslations({ locale, namespace: "eventDetail" })
  const tLightbox = await getTranslations({ locale, namespace: "lightbox" })

  const otherEvents = event.artist
    ? await getOtherEventsByArtist(event.artist.id, event.id, 3)
    : []

  // El accent visual (flyer fallback) se deriva del primer género del evento.
  const accent = genreAccent(event.genres[0])
  const fallbackAccent = accent === "neutral" ? "brand" : accent
  const resolvedLocale = locale

  const nextDate = event.dates[0] ?? null
  const otherDates = event.dates.slice(1)
  const timeRange = extractTimeRange(event.time)

  // Eyebrow "live" si la próxima fecha cae en los próximos 7 días.
  // Comparamos contra **bounds de día calendario** (todayStart 00:00 →
  // in7End 23:59:59.999), no contra timestamps exactos: si un evento es
  // hoy a las 21:00 y son las 22:00 del día anterior + 1 minuto (00:01),
  // sigue siendo "hoy" para nosotros — no debe salir del rango EN VIVO
  // por la hora del clock. La decisión es visual, no necesita más precisión.
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const in7End = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 7,
    23,
    59,
    59,
    999
  )
  const isLive = nextDate ? nextDate >= todayStart && nextDate <= in7End : false

  // Array unificado para el lightbox: cover en index 0, thumbs nuevos
  // en index 1..N-1. Misma estructura que en /artists/[slug].
  //
  // INVARIANTE: hero y `lightboxImages[0]` apuntan al MISMO image físico.
  // El service (`getEventBySlug` en `services/events.ts`) deriva
  // `coverImage = images[0].url` y `coverImageAlt = images[0].alt`, así
  // que el `<FlyerImage>` del hero y el slide 0 del lightbox renderizan
  // exactamente la misma imagen. El hero usa el campo extra
  // `coverImagePublicId` para activar el path de `<CldImage>` con
  // transformaciones Cloudinary del flyer; el lightbox usa la URL plana.
  const lightboxImages: ImageEntry[] = event.images.map((img) => ({
    src: img.url,
    alt: img.alt ?? event.title,
  }))

  // Hoist del FlyerImage del hero para evitar duplicación entre las dos
  // ramas del conditional de abajo (trigger vs plain) — mismo patrón
  // usado en /artists/[slug].
  const hero = (
    <FlyerImage
      publicId={event.coverImagePublicId ?? undefined}
      src={event.coverImage ?? undefined}
      alt={event.coverImageAlt ?? event.title}
      aspectRatio="4:5"
      fallbackAccent={fallbackAccent}
      priority
    />
  )

  // Link de Google Maps: combina venue + dirección para mejorar resultados
  // cuando solo está el nombre del local sin dirección exacta.
  const addressLink = event.address ? (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [event.location, event.address].filter(Boolean).join(", ")
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-brand transition-colors"
    >
      {event.address}
    </a>
  ) : null

  return (
    <>
      <div className="max-w-7xl mx-auto px-m sm:px-l py-l lg:py-xl">
        {/* Breadcrumb */}
        <Link
          href="/events"
          className="inline-flex items-center gap-xs text-body-s text-fg-secondary hover:text-fg-primary transition-colors mb-l"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          <span>{t("backToEvents")}</span>
        </Link>

        <ImageLightboxRoot images={lightboxImages}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
          {/* Columna izquierda: flyer sticky */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--layout-header-h)+24px)]">
              {lightboxImages.length > 0 ? (
                <ImageLightboxTrigger
                  index={0}
                  ariaLabel={tLightbox("openImage", { index: 1, total: lightboxImages.length })}
                >
                  {hero}
                </ImageLightboxTrigger>
              ) : (
                hero
              )}
            </div>
          </div>

          {/* Columna derecha: info */}
          <div className="lg:col-span-7 flex flex-col gap-l pb-[calc(env(safe-area-inset-bottom)+96px)] lg:pb-0">
            {/* Eyebrow con chips */}
            <div className="flex flex-wrap items-center gap-xs">
              {isLive ? (
                <Chip accent="brand" active size="s">
                  {t("eyebrow.live")}
                </Chip>
              ) : null}
              {event.genres.map((genre) => {
                const a = genreAccent(genre)
                return (
                  <Chip key={genre} accent={a === "neutral" ? "brand" : a} active size="s">
                    {genre}
                  </Chip>
                )
              })}
            </div>

            {/* Título + artista vinculado */}
            <header className="flex flex-col gap-s">
              <h1 className="text-heading-l sm:text-display-m font-display text-fg-primary leading-tight">
                {event.title}
              </h1>
              {/* Byline: linkea al perfil del creator que publicó el evento.
                  Fallback a texto plano si el creator no tiene slug (legacy
                  user pre-Task-1-backfill o el script no corrió aún). */}
              {event.publishedBy.slug ? (
                <Link
                  href={`/creators/${event.publishedBy.slug}`}
                  className="text-body-s text-fg-secondary hover:text-brand transition-colors w-fit"
                >
                  {t("publishedBy")}{" "}
                  <span className="text-fg-primary">
                    {event.publishedBy.name}
                  </span>
                </Link>
              ) : (
                <p className="text-body-s text-fg-secondary">
                  {t("publishedBy")} {event.publishedBy.name}
                </p>
              )}
              {event.artist ? (
                <p className="text-body-l text-fg-secondary">
                  <Link
                    href={`/artists/${event.artist.slug}`}
                    className="hover:text-fg-primary transition-colors font-medium"
                  >
                    {event.artist.name}
                  </Link>
                  {event.artist.origin ? (
                    <span className="text-fg-tertiary">
                      {" "}
                      · {event.artist.origin}
                    </span>
                  ) : null}
                </p>
              ) : event.artistName ? (
                <p className="text-body-l text-fg-secondary font-medium">
                  {event.artistName}
                </p>
              ) : null}
            </header>

            {/* Fact grid 2×2 */}
            <FactGrid
              items={[
                {
                  id: "when",
                  label: t("facts.when"),
                  value: nextDate
                    ? formatEventDateLong(nextDate, event.time, resolvedLocale)
                    : null,
                },
                {
                  id: "timing",
                  label: t("facts.timing"),
                  value: timeRange,
                },
                {
                  id: "where",
                  label: t("facts.where"),
                  value: event.location,
                },
                {
                  id: "address",
                  label: t("facts.address"),
                  value: addressLink,
                },
              ]}
            />

            {/* CTA principal */}
            <EventAccessCTA price={event.price} locale={resolvedLocale} />

            {/* About */}
            {event.description ? (
              <section className="flex flex-col gap-s">
                <Eyebrow as="h2">{t("about")}</Eyebrow>
                <p className="text-body text-fg-primary leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </section>
            ) : null}

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

            {/* Más fechas del mismo evento */}
            {otherDates.length > 0 ? (
              <section className="flex flex-col gap-s">
                <Eyebrow as="h2">{t("moreDates")}</Eyebrow>
                <ul className="flex flex-col gap-xs">
                  {otherDates.map((d, i) => (
                    <li key={i} className="text-body text-fg-secondary">
                      {formatEventDateLong(d, event.time, resolvedLocale)}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Otros shows del artista */}
            {otherEvents.length > 0 ? (
              <section className="flex flex-col gap-m">
                <Eyebrow as="h2">{t("otherEvents")}</Eyebrow>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-m">
                  {otherEvents.map((ev) => (
                    <li key={ev.id}>
                      <EventCard event={ev} locale={resolvedLocale} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
        </ImageLightboxRoot>
      </div>

      {/* Sticky CTA mobile */}
      <StickyCTABar>
        <EventAccessCTA
          price={event.price}
          locale={resolvedLocale}
          variant="compact"
        />
      </StickyCTABar>
    </>
  )
}
