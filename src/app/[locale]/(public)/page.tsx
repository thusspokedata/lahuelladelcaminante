import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import {
  getFeaturedEvents,
  getUpcomingEvents,
  getUpcomingEventsWithin,
  getUpcomingStats,
  getActiveGenres,
  type EventSummary,
  type UpcomingStats,
} from "@/services/events"
import { getActiveArtists } from "@/services/artists"
import { getCurrentUser } from "@/services/auth"
import { EventCard } from "@/components/events/EventCard"
import { EventRow } from "@/components/events/EventRow"
import { ArtistCard } from "@/components/artists/ArtistCard"
import Eyebrow from "@/components/ui/Eyebrow"
import SectionHeader from "@/components/ui/SectionHeader"

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
  const tHome = await getTranslations({ locale, namespace: "home" })

  const [
    upcomingThisWeek,
    upcomingThisMonth,
    featuredEvents,
    upcomingAll,
    activeArtists,
    activeGenres,
    stats,
    user,
  ] = await Promise.all([
    getUpcomingEventsWithin(7, 1),
    getUpcomingEventsWithin(30, 1),
    getFeaturedEvents(3),
    getUpcomingEvents(),
    getActiveArtists(8),
    getActiveGenres(),
    getUpcomingStats(),
    getCurrentUser(),
  ])

  const heroVariant: "thisWeek" | "nextMonth" | "whatComes" =
    upcomingThisWeek.length > 0
      ? "thisWeek"
      : upcomingThisMonth.length > 0
        ? "nextMonth"
        : "whatComes"

  return (
    <div>
      <HeroSection variant={heroVariant} locale={locale} />

      <StatsSection stats={stats} locale={locale} />

      {featuredEvents.length > 0 ? (
        <FeaturedSection events={featuredEvents} locale={locale} />
      ) : null}

      {upcomingAll.length > 0 ? (
        <AgendaSection
          events={upcomingAll.slice(0, 10)}
          genres={activeGenres}
          locale={locale}
        />
      ) : null}

      {activeArtists.length > 0 ? (
        <ArtistsSection artists={activeArtists} />
      ) : null}

      {!user ? <CtaSection /> : null}

      <p className="sr-only">{tHome("badge")}</p>
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────

interface HeroSectionProps {
  variant: "thisWeek" | "nextMonth" | "whatComes"
  locale: string
}

async function HeroSection({ variant, locale }: HeroSectionProps) {
  const tHero = await getTranslations({ locale, namespace: "home.hero" })

  // El copy del h1 tiene dos partes: prefijo neutro + sufijo coloreado.
  // Cada variante tiene su par (`*Prefix` / `*Highlight`) en messages.
  const prefix = tHero(`${variant}Prefix`)
  const highlight = tHero(`${variant}Highlight`)

  return (
    <section
      className={cn("relative overflow-hidden border-b border-border", SECTION_GAP_CLASS)}
      style={{ paddingTop: "var(--space-3xl)", paddingBottom: "var(--space-3xl)" }}
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
    </section>
  )
}

// ── Stats ─────────────────────────────────────────────────────────────

interface StatsSectionProps {
  stats: UpcomingStats
  locale: string
}

async function StatsSection({ stats, locale }: StatsSectionProps) {
  const tStats = await getTranslations({ locale, namespace: "home.stats" })
  const dateRange = formatDateRange(stats.dateRange, locale)

  const items = [
    { value: String(stats.shows), label: tStats("shows") },
    { value: String(stats.artists), label: tStats("artists") },
    { value: String(stats.cities), label: tStats("cities") },
    { value: dateRange || "—", label: tStats("dateRange") },
  ]

  return (
    <section className="border-b border-border" style={{ paddingTop: "var(--space-xl)", paddingBottom: "var(--space-xl)" }}>
      <div className="mx-auto grid grid-cols-2 gap-l lg:grid-cols-4" style={CONTAINER_STYLE}>
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-xs">
            <span className="text-display-m font-display text-fg-primary leading-none">
              {item.value}
            </span>
            <span className="text-caption font-mono uppercase text-fg-tertiary">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Featured ──────────────────────────────────────────────────────────

interface FeaturedSectionProps {
  events: EventSummary[]
  locale: string
}

async function FeaturedSection({ events, locale }: FeaturedSectionProps) {
  const t = await getTranslations({ locale, namespace: "home.featured" })

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
              <FilterChip
                href="/events"
                label={t("filterAll")}
                active
              />
              {genreChips.map((g) => (
                <FilterChip
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

interface FilterChipProps {
  href: string
  label: string
  active?: boolean
}

function FilterChip({ href, label, active = false }: FilterChipProps) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 inline-flex items-center rounded-pill border px-m py-xs",
        "text-body-s font-medium transition-colors duration-200 ease-out",
        active
          ? "bg-fg-primary text-bg-page border-fg-primary"
          : "bg-bg-surface-2 text-fg-secondary border-border hover:bg-bg-surface-3 hover:text-fg-primary"
      )}
    >
      {label}
    </Link>
  )
}

// ── Artists ───────────────────────────────────────────────────────────

interface ArtistsSectionProps {
  artists: Awaited<ReturnType<typeof getActiveArtists>>
}

async function ArtistsSection({ artists }: ArtistsSectionProps) {
  const t = await getTranslations("home.artists")

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

// ── Helpers ───────────────────────────────────────────────────────────

const LOCALE_MAP: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  de: "de-DE",
}

function formatDateRange(
  range: { from: Date | null; to: Date | null },
  locale: string
): string {
  if (!range.from || !range.to) return ""
  const intl = new Intl.DateTimeFormat(LOCALE_MAP[locale] ?? "es-ES", {
    day: "numeric",
    month: "short",
  })
  const from = intl.format(range.from).replace(/\./g, "")
  const to = intl.format(range.to).replace(/\./g, "")
  if (from === to) return from
  return `${from} – ${to}`
}
