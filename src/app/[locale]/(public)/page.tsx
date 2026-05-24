import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { isTodayBerlin } from "@/lib/date"
import {
  getHeroVariant,
  getUpcomingEventsWithin,
  getPastEvents,
  getActiveGenres,
  type EventSummary,
} from "@/services/events"
import { getActiveArtists } from "@/services/artists"
import { getCurrentUser } from "@/services/auth"
import { EventCard } from "@/components/events/EventCard"
import { EventRow } from "@/components/events/EventRow"
import { ArtistCard } from "@/components/artists/ArtistCard"
import Eyebrow from "@/components/ui/Eyebrow"
import SectionHeader from "@/components/ui/SectionHeader"
import {
  CHIP_ACTIVE_BG,
  CHIP_BASE,
  CHIP_IDLE_BG,
  CHIP_SIZE,
} from "@/components/ui/chip-styles"

const SECTION_GAP_CLASS = "py-3xl"
const CONTAINER_STYLE = {
  maxWidth: "var(--layout-max-w)",
  paddingLeft: "var(--layout-gutter)",
  paddingRight: "var(--layout-gutter)",
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const [
    heroVariant,
    nextWeeksEvents,
    upcomingAgenda,
    activeArtists,
    activeGenres,
    pastEvents,
    user,
  ] = await Promise.all([
    getHeroVariant(),
    // Próximos 3 dentro de las 4 semanas — sección "Próximas 4 semanas".
    getUpcomingEventsWithin(28, 3),
    // Próximos 10 dentro del próximo año, suficiente para la agenda
    // compacta de la home sin traer toda la lista futura.
    getUpcomingEventsWithin(365, 10),
    getActiveArtists(8),
    getActiveGenres(),
    // 4 pasados más recientes para la sección de archivo del final.
    getPastEvents(4),
    getCurrentUser(),
  ])

  // Separamos los eventos de HOY de los demás futuros. Los de hoy van
  // arriba en su propia sección destacada con badge "HOY"; el resto baja
  // a "Próximas 4 semanas" y "Próximas semanas" sin duplicar. Derivamos
  // del agenda (10/365d) porque ahí seguro caben todos los de hoy aunque
  // sean varios.
  const todayEvents = upcomingAgenda.filter((ev) =>
    ev.dates.some((d) => isTodayBerlin(d))
  )
  const todayIds = new Set(todayEvents.map((ev) => ev.id))
  const futureAgenda = upcomingAgenda.filter((ev) => !todayIds.has(ev.id))
  const futureNextWeeks = nextWeeksEvents.filter((ev) => !todayIds.has(ev.id))

  // El mini-card del hero (mobile) muestra el próximo show DESPUÉS de hoy
  // — si hay eventos hoy, esos ya están destacados arriba; el mini-card
  // entonces actúa como teaser "lo que viene después".
  const nextEvent = futureAgenda[0] ?? null

  return (
    <div>
      <HeroSection variant={heroVariant} nextEvent={nextEvent} locale={locale} />

      {/* StatsSection (shows/artistas/ciudades/rango) oculta por ahora —
          con la agenda todavía chica los contadores quedan flojos.
          Re-agregar cuando crezca: `git log` tiene el componente, el copy
          sigue en `messages.home.stats`. */}

      {todayEvents.length > 0 ? (
        <TodaySection events={todayEvents} locale={locale} />
      ) : null}

      {futureNextWeeks.length > 0 ? (
        <NextWeeksSection events={futureNextWeeks} locale={locale} />
      ) : null}

      {futureAgenda.length > 0 ? (
        <AgendaSection
          events={futureAgenda}
          genres={activeGenres}
          locale={locale}
        />
      ) : null}

      {activeArtists.length > 0 ? (
        <ArtistsSection artists={activeArtists} locale={locale} />
      ) : null}

      {!user ? <CtaSection /> : null}

      {pastEvents.length > 0 ? (
        <PastEventsSection events={pastEvents} locale={locale} />
      ) : null}
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────

interface HeroSectionProps {
  variant: "thisWeek" | "nextMonth" | "whatComes"
  nextEvent: EventSummary | null
  locale: string
}

async function HeroSection({ variant, nextEvent, locale }: HeroSectionProps) {
  const tHero = await getTranslations({ locale, namespace: "home.hero" })

  // El copy del h1 tiene dos partes: prefijo neutro + sufijo coloreado.
  // Cada variante tiene su par (`*Prefix` / `*Highlight`) en messages.
  const prefix = tHero(`${variant}Prefix`)
  const highlight = tHero(`${variant}Highlight`)

  return (
    <section
      className={cn("relative overflow-hidden border-b border-border", SECTION_GAP_CLASS)}
    >
      <div
        className="mx-auto grid grid-cols-1 gap-xl lg:grid-cols-[1.4fr_1fr] lg:items-end"
        style={CONTAINER_STYLE}
      >
        <div className="flex flex-col gap-l">
          <Eyebrow>{tHero("eyebrow")}</Eyebrow>
          <h1
            className={cn(
              "text-display-m sm:text-display-l lg:text-display-xl",
              "font-display text-fg-primary leading-[0.94] tracking-tight"
            )}
          >
            {prefix}{" "}
            <span className="text-editorial">{highlight}</span>
            <span aria-hidden="true">.</span>
          </h1>
        </div>
        <p className="text-body-l text-fg-secondary leading-relaxed max-w-[40ch] lg:justify-self-end">
          {tHero("tagline")}
        </p>
      </div>
      {/* Mini-card del próximo show — sibling de la grilla, no parte
          de ella (la grilla pasa a 2 columnas en `lg` y el mini-card
          tendría posición rara). Visible mientras el hero queda en
          1 columna (mobile + tablet, <`lg`). A partir de `lg` se
          oculta — el hero ya tiene info densa en sus 2 cols. */}
      {nextEvent ? (
        <div
          className="mx-auto mt-xl lg:hidden"
          style={CONTAINER_STYLE}
        >
          <EventRow event={nextEvent} locale={locale} />
        </div>
      ) : null}
    </section>
  )
}

// ── Hoy ───────────────────────────────────────────────────────────────

interface TodaySectionProps {
  events: EventSummary[]
  locale: string
}

/**
 * Sección de eventos de HOY (día calendario Berlín). Aparece arriba del
 * home cuando hay al menos un evento que sucede hoy. Reusa `EventCard`
 * con la prop `todayLabel`, que tiñe el `DateTile` de rojo (accent
 * `brand`) y reemplaza el eyebrow por "HOY · 21:00" (o "HOY" si el
 * evento no tiene `time`). Si no hay eventos hoy, el caller no la
 * renderiza — no muestra una sección vacía.
 */
async function TodaySection({ events, locale }: TodaySectionProps) {
  const t = await getTranslations({ locale, namespace: "home.today" })
  const badge = t("badge")

  return (
    <section className={cn(SECTION_GAP_CLASS, "border-b border-border")}>
      <div className="mx-auto flex flex-col gap-xl" style={CONTAINER_STYLE}>
        <SectionHeader title={t("title")} />
        <div className="grid grid-cols-1 gap-l sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              variant="featured"
              priority={index === 0}
              locale={locale}
              todayLabel={badge}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Próximas 4 semanas ────────────────────────────────────────────────

interface NextWeeksSectionProps {
  events: EventSummary[]
  locale: string
}

async function NextWeeksSection({ events, locale }: NextWeeksSectionProps) {
  const t = await getTranslations({ locale, namespace: "home.nextWeeks" })

  return (
    <section className={SECTION_GAP_CLASS}>
      <div className="mx-auto flex flex-col gap-xl" style={CONTAINER_STYLE}>
        <SectionHeader
          eyebrow={t("eyebrow")}
          accent="editorial"
          title={t("title")}
          action={
            <Link
              href="/events"
              className="text-body-s font-semibold text-editorial hover:text-editorial/80 transition-colors"
            >
              {t("viewAll")}
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-l sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              variant="featured"
              priority={index === 0}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Agenda ────────────────────────────────────────────────────────────

interface AgendaSectionProps {
  events: EventSummary[]
  genres: string[]
  locale: string
}

async function AgendaSection({ events, genres, locale }: AgendaSectionProps) {
  const t = await getTranslations({ locale, namespace: "home.upcoming" })
  // Lista cerrada de chips: "Todos" + hasta 5 géneros activos. Si hay más
  // géneros la lista se trunca acá (la página /events tiene el set completo).
  const genreChips = genres.slice(0, 5)

  return (
    <section className={cn(SECTION_GAP_CLASS, "border-t border-border")}>
      <div className="mx-auto flex flex-col gap-xl" style={CONTAINER_STYLE}>
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          action={
            <div className="flex gap-s overflow-x-auto scrollbar-none -mx-m px-m">
              {/* Atajos de filtro a /events — ninguno representa estado
                  activo en la home (no hay filtro local). El primero
                  ("Todos") va sin querystring; el resto pasan genre. */}
              <FilterShortcut href="/events" label={t("filterAll")} highlight />
              {genreChips.map((g) => (
                <FilterShortcut
                  key={g}
                  href={`/events?genre=${encodeURIComponent(g)}`}
                  label={g}
                />
              ))}
            </div>
          }
        />
        <div className="flex flex-col gap-s">
          {events.map((event) => (
            <EventRow key={event.id} event={event} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface FilterShortcutProps {
  href: string
  label: string
  /** El primer atajo ("Todos") se renderiza un poco más fuerte para
   * hacer evidente que es la opción default — pero NO con estado
   * `active` (en la home no hay filtro real, todos son links a /events). */
  highlight?: boolean
}

function FilterShortcut({ href, label, highlight = false }: FilterShortcutProps) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 transition-colors duration-200 ease-out",
        CHIP_BASE,
        CHIP_SIZE.m,
        highlight
          ? CHIP_ACTIVE_BG.neutral
          : `${CHIP_IDLE_BG} hover:bg-bg-surface-3 hover:text-fg-primary`,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
      )}
    >
      {label}
    </Link>
  )
}

// ── Artists ───────────────────────────────────────────────────────────

interface ArtistsSectionProps {
  artists: Awaited<ReturnType<typeof getActiveArtists>>
  locale: string
}

async function ArtistsSection({ artists, locale }: ArtistsSectionProps) {
  const t = await getTranslations({ locale, namespace: "home.artists" })

  return (
    <section className={cn(SECTION_GAP_CLASS, "border-t border-border")}>
      <div className="mx-auto flex flex-col gap-xl" style={CONTAINER_STYLE}>
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          action={
            <Link
              href="/artists"
              className="text-body-s font-semibold text-fg-primary hover:text-brand transition-colors"
            >
              {t("viewAll")}
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-l sm:grid-cols-3 lg:grid-cols-4">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA ───────────────────────────────────────────────────────────────

async function CtaSection() {
  const t = await getTranslations("home.cta")

  return (
    <section className={cn(SECTION_GAP_CLASS, "border-t border-border")}>
      <div className="mx-auto" style={CONTAINER_STYLE}>
        <div
          className={cn(
            "flex flex-col items-start gap-l rounded-xl bg-bg-surface border border-border",
            "p-xl lg:flex-row lg:items-center lg:justify-between"
          )}
        >
          <div className="flex flex-col gap-s max-w-[48ch]">
            <Eyebrow accent="brand">{t("eyebrow")}</Eyebrow>
            <h2 className="text-heading-l font-display text-fg-primary">
              {t("title")}
            </h2>
          </div>
          <Link
            href="/apply"
            className={cn(
              "inline-flex items-center rounded-pill bg-brand text-on-brand",
              "px-xl py-s text-body-l font-semibold shrink-0",
              "hover:bg-brand-dim transition-colors duration-200 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
            )}
          >
            {t("button")} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Past events ────────────────────────────────────────────────────────

interface PastEventsSectionProps {
  events: EventSummary[]
  locale: string
}

/**
 * Sección de archivo al final del home: los eventos pasados más
 * recientes. Da impronta — un portal con historia se ve más vivo.
 *
 * Usa el `EventCard` default (mismo que `/events/past`), no la variante
 * `featured` de la sección de destacados — eso, más el encabezado claro
 * "ARCHIVO · Eventos pasados", evita confundir un evento pasado con uno
 * próximo. El caller no la renderiza si `events` viene vacío.
 */
async function PastEventsSection({ events, locale }: PastEventsSectionProps) {
  const t = await getTranslations({ locale, namespace: "home.past" })

  return (
    <section className={cn(SECTION_GAP_CLASS, "border-t border-border")}>
      <div className="mx-auto flex flex-col gap-xl" style={CONTAINER_STYLE}>
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          action={
            <Link
              href="/events/past"
              className="text-body-s font-semibold text-fg-primary hover:text-brand transition-colors"
            >
              {t("viewAll")}
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-l sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  )
}
