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
 * Variantes:
 *  - `dashboard = false` (default): el row entero es un `<Link>` al detalle
 *    público, hover lift suave. Server async.
 *  - `dashboard = true`: el row NO es link envolvente — el título es link
 *    al detalle público, y el caller provee un `actions` slot (típicamente
 *    `<EventRowActions>` con dropdown de admin). Se muestra también un
 *    badge "Borrador / Publicado" en el centro. Server async.
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
  /**
   * Variante dashboard del creator/admin. Cuando `true`:
   *  - El row no es link envolvente; el título sí.
   *  - Se muestra `statusBadge` (Borrador/Publicado/Pasado) y el slot `actions`.
   */
  dashboard?: boolean
  /**
   * Slot a la derecha con acciones admin. Solo se renderiza si `dashboard`
   * es `true`. Típico: `<EventRowActions eventId={event.id} ... />`.
   */
  actions?: React.ReactNode
  /**
   * Texto del status badge (Borrador / Publicado / Pasado). Se renderiza
   * solo si `dashboard` es `true` y el badge se provee.
   */
  statusBadge?: {
    label: string
    /** Brand accent. Default `neutral` (gris) para "Publicado". */
    accent?: "brand" | "editorial" | "creator" | "neutral"
  }
}

export async function EventRow({
  event,
  locale,
  dashboard = false,
  actions,
  statusBadge,
}: EventRowProps) {
  const resolvedLocale = locale ?? (await getLocale())
  const nextDate = event.dates[0] ?? null
  // El accent visual de la row se deriva del primer género del evento.
  const accent = genreAccent(event.genres[0])

  const subtitle = [event.location, event.time].filter(Boolean).join(" · ")

  const rowClass = cn(
    "group flex items-center gap-m p-s rounded-m bg-bg-surface border border-border",
    !dashboard && [
      "transition-all duration-200 ease-out",
      "hover:bg-bg-surface-2 hover:border-border-hi",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
      "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
    ]
  )

  // Contenido común a las dos variantes (dateTile + thumb + info + chip).
  const dateBlock = nextDate ? (
    <div className="shrink-0">
      <DateTile date={nextDate} size="s" locale={resolvedLocale} />
    </div>
  ) : null

  const thumbBlock = (
    <div className="shrink-0 w-[64px] hidden sm:block">
      <FlyerImage
        publicId={event.coverImagePublicId ?? undefined}
        src={event.coverImage ?? undefined}
        alt={event.coverImageAlt ?? event.title}
        aspectRatio="1:1"
        fallbackAccent={accent === "neutral" ? "brand" : accent}
      />
    </div>
  )

  const titleNode = (
    <h3 className="text-body-l font-display font-semibold text-fg-primary line-clamp-1">
      {event.title}
    </h3>
  )

  const subtitleNode = subtitle ? (
    <p className="text-body-s text-fg-secondary line-clamp-1">{subtitle}</p>
  ) : null

  const genreChip = event.genres.length > 0 ? (
    <div className="shrink-0 hidden md:flex flex-wrap justify-end gap-xs">
      {event.genres.map((genre) => (
        <Chip key={genre} accent={genreAccent(genre)} active size="s">
          {genre}
        </Chip>
      ))}
    </div>
  ) : null

  // Variante pública: row entero como link.
  if (!dashboard) {
    return (
      <Link href={`/events/${event.slug}`} className={rowClass}>
        {dateBlock}
        {thumbBlock}
        <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
          {titleNode}
          {subtitleNode}
        </div>
        {genreChip}
      </Link>
    )
  }

  // Variante dashboard: row plano, título como link, badge de status y slot actions.
  // `<article>` en lugar de `<Link>` para no nesting interactive elements.
  return (
    <article className={rowClass}>
      {dateBlock}
      {thumbBlock}
      <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
        <Link
          href={`/events/${event.slug}`}
          className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-creator focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page rounded-xs"
        >
          {titleNode}
        </Link>
        {subtitleNode}
      </div>
      {statusBadge ? (
        <div className="shrink-0 hidden md:block">
          <Chip accent={statusBadge.accent ?? "neutral"} active size="s">
            {statusBadge.label}
          </Chip>
        </div>
      ) : null}
      {genreChip}
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </article>
  )
}
