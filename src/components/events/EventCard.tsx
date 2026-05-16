/**
 * EventCard — card pública de evento, ratio 4:5.
 *
 * Composición:
 *  - `FlyerImage` arriba (4:5) con overlay de `DateTile` (top-left) y
 *    `Chip` del género (top-right, accent según `genreAccent`).
 *  - Bloque de info debajo: eyebrow con fecha + hora, título, lugar y
 *    artista, precio o modo de acceso.
 *
 * La card entera es un `<Link>` al detalle. Hover → lift 2px + brillo
 * del borde, transición 200ms ease-out (handoff §5.3 regla 2).
 *
 * Variantes:
 *  - `default`: card estándar (próximos, agenda densa).
 *  - `featured`: tratamiento destacado, borde dorado sutil, eyebrow del
 *    encabezado en accent editorial.
 *
 * Es server async porque renderiza `DateTile` (async server).
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §3 + §4.1.
 */

import { getLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { genreAccent } from "@/lib/genre-accent"
import type { EventSummary } from "@/services/events"
import Chip from "@/components/ui/Chip"
import Eyebrow from "@/components/ui/Eyebrow"
import FlyerImage from "@/components/ui/FlyerImage"
import DateTile from "./DateTile"

export interface EventCardProps {
  event: EventSummary
  variant?: "default" | "featured"
  /** Pasar `true` solo en eventos above-the-fold (LCP). */
  priority?: boolean
  /** Si el caller ya resolvió el locale, pasarlo evita un await por card. */
  locale?: string
}

const MONTHS_BY_LOCALE: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  de: "de-DE",
}

export async function EventCard({
  event,
  variant = "default",
  priority = false,
  locale,
}: EventCardProps) {
  const resolvedLocale = locale ?? (await getLocale())
  const nextDate = event.dates[0] ?? null
  const accent = genreAccent(event.genre)
  const isFeatured = variant === "featured"

  const eyebrowText = formatEyebrow(nextDate, event.time, resolvedLocale)

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "group flex flex-col h-full overflow-hidden rounded-l bg-bg-surface border",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-[2px] hover:border-border-hi",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
        isFeatured ? "border-editorial/40" : "border-border"
      )}
    >
      {/* Imagen 4:5 con overlays */}
      <div className="relative">
        <FlyerImage
          publicId={event.coverImagePublicId ?? undefined}
          src={event.coverImage ?? undefined}
          alt={event.coverImageAlt ?? event.title}
          aspectRatio="4:5"
          priority={priority}
          fallbackAccent={accent === "neutral" ? "brand" : accent}
        />

        {nextDate ? (
          <div className="absolute top-m left-m">
            <DateTile date={nextDate} size="m" locale={resolvedLocale} />
          </div>
        ) : null}

        {event.genre ? (
          <div className="absolute top-m right-m">
            <Chip accent={accent} active size="s">
              {event.genre}
            </Chip>
          </div>
        ) : null}
      </div>

      {/* Info debajo del flyer */}
      <div className="flex flex-col gap-xs p-m flex-1">
        {eyebrowText ? (
          <Eyebrow accent={isFeatured ? "editorial" : "neutral"}>
            {eyebrowText}
          </Eyebrow>
        ) : null}

        <h3 className="text-heading-s font-display text-fg-primary line-clamp-2">
          {event.title}
        </h3>

        <p className="text-body-s text-fg-secondary line-clamp-1">
          {event.location}
        </p>

        {event.artistName || event.price ? (
          <div className="mt-auto pt-s flex items-end justify-between gap-s">
            {event.artistName ? (
              <span className="text-caption text-fg-tertiary font-mono uppercase line-clamp-1">
                {event.artistName}
              </span>
            ) : (
              <span />
            )}
            {event.price ? (
              <span className="text-body-s font-semibold text-fg-primary shrink-0">
                {event.price}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  )
}

/** "DOM 7 JUN · 19:30" (o equivalente por locale). Vacío si no hay date. */
function formatEyebrow(
  date: Date | null,
  time: string | null,
  locale: string
): string {
  if (!date) return ""
  const intl = new Intl.DateTimeFormat(MONTHS_BY_LOCALE[locale] ?? "es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
  const label = intl.format(date).replace(/\./g, "").toUpperCase()
  return time ? `${label} · ${time}` : label
}

// Mantiene compat con consumidores que importan `{ EventCard }` (named) y
// otros que prefieran default export. La card ya estaba exportada como
// named; los nuevos consumidores pueden importar via default.
export default EventCard
