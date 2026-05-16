/**
 * EventRow — variante compacta horizontal de `EventCard`, para listas
 * densas tipo agenda (sección "Próximas semanas" de la home, sidebar de
 * eventos relacionados, dashboard).
 *
 * Composición horizontal:
 *  - `DateTile` chico a la izquierda.
 *  - Thumbnail 1:1 de ~64px (FlyerImage compact).
 *  - Bloque central: título + lugar/hora en una línea.
 *  - `Chip` del género a la derecha (accent según `genreAccent`).
 *
 * Server async (renderiza `DateTile`). Link envolvente al detalle.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

import { getLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { genreAccent } from "@/lib/genre-accent"
import type { EventSummary } from "@/services/events"
import Chip from "@/components/ui/Chip"
import FlyerImage from "@/components/ui/FlyerImage"
import DateTile from "./DateTile"

export interface EventRowProps {
  event: EventSummary
  /** Si el caller ya resolvió el locale, pasarlo evita un await por row. */
  locale?: string
}

export async function EventRow({ event, locale }: EventRowProps) {
  const resolvedLocale = locale ?? (await getLocale())
  const nextDate = event.dates[0] ?? null
  const accent = genreAccent(event.genre)

  const subtitle = [event.location, event.time].filter(Boolean).join(" · ")

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "group flex items-center gap-m p-s rounded-m bg-bg-surface border border-border",
        "transition-all duration-200 ease-out",
        "hover:bg-bg-surface-2 hover:border-border-hi",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
      )}
    >
      {nextDate ? (
        <div className="shrink-0">
          <DateTile date={nextDate} size="s" locale={resolvedLocale} />
        </div>
      ) : null}

      <div className="shrink-0 w-[64px] hidden sm:block">
        <FlyerImage
          publicId={event.coverImagePublicId ?? undefined}
          src={event.coverImage ?? undefined}
          alt={event.coverImageAlt ?? event.title}
          aspectRatio="1:1"
          fallbackAccent={accent === "neutral" ? "brand" : accent}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
        <h3 className="text-body-l font-display font-semibold text-fg-primary line-clamp-1">
          {event.title}
        </h3>
        {subtitle ? (
          <p className="text-body-s text-fg-secondary line-clamp-1">
            {subtitle}
          </p>
        ) : null}
      </div>

      {event.genre ? (
        <div className="shrink-0 hidden md:block">
          <Chip accent={accent} active size="s">
            {event.genre}
          </Chip>
        </div>
      ) : null}
    </Link>
  )
}

