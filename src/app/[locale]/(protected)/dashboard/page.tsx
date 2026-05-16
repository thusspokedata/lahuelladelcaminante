/**
 * `/dashboard` — overview del creator.
 *
 * Dos estados muy distintos según si el creator ya tiene contenido:
 *  - **Vacío (primer ingreso):** onboarding con `OnboardingChecklist` (3
 *    pasos) + bloque de ayuda al final.
 *  - **Con contenido:** header con counts + sección "Mis próximos eventos"
 *    (hasta 5 EventRows en modo dashboard, con dropdown de acciones) +
 *    sección "Mis artistas" (hasta 4 ArtistCards en modo dashboard).
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4 ("Panel creator", capturas
 * "primer ingreso onboarding" y "con contenido").
 */

import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { requireActive } from "@/services/auth"
import { getEventsByUserGrouped } from "@/services/events"
import { getArtistsByUser } from "@/services/artists"
import Eyebrow from "@/components/ui/Eyebrow"
import SectionHeader from "@/components/ui/SectionHeader"
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist"
import { EventRow } from "@/components/events/EventRow"
import { ArtistCard } from "@/components/artists/ArtistCard"
import EventRowActions from "@/components/dashboard/EventRowActions"

const OVERVIEW_EVENTS_LIMIT = 5
const OVERVIEW_ARTISTS_LIMIT = 4

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { user } = await requireActive(locale)

  const [grouped, artists] = await Promise.all([
    getEventsByUserGrouped(user.id),
    getArtistsByUser(user.id),
  ])

  const hasContent = grouped.all.length > 0 || artists.length > 0

  if (!hasContent) {
    return <EmptyState locale={locale} />
  }

  return <ContentState locale={locale} grouped={grouped} artists={artists} />
}

// ── Empty state (onboarding) ──────────────────────────────────────────

async function EmptyState({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "dashboard" })

  return (
    <div className="flex flex-col gap-3xl">
      {/* Welcome header */}
      <header className="flex flex-col gap-m">
        <Eyebrow accent="creator">{t("welcome.eyebrow")}</Eyebrow>
        <h1 className="text-display-m sm:text-display-l font-display text-fg-primary leading-[0.95]">
          {t("welcome.title")}
        </h1>
        <p className="text-body-l text-fg-secondary max-w-[60ch]">
          {t("welcome.body")}
        </p>
      </header>

      <OnboardingChecklist
        hasArtist={false}
        hasEvent={false}
        labels={{
          pending: t("steps.pending"),
          done: t("steps.done"),
          profile: {
            title: t("steps.profile.title"),
            body: t("steps.profile.body"),
            cta: t("steps.profile.cta"),
          },
          event: {
            title: t("steps.event.title"),
            body: t("steps.event.body"),
            cta: t("steps.event.cta"),
          },
          share: {
            title: t("steps.share.title"),
            body: t("steps.share.body"),
            cta: t("steps.share.cta"),
          },
        }}
        hrefs={{
          profile: "/dashboard/artists/create",
          event: "/dashboard/events/create",
          share: "/events",
        }}
      />

      <section className="flex flex-col gap-s rounded-l border border-border bg-bg-surface p-l">
        <Eyebrow>{t("help.eyebrow")}</Eyebrow>
        <p className="text-body text-fg-secondary leading-relaxed">
          {t("help.body")}
        </p>
        {/* TODO: cuando exista la guía real, cambiar `#` por su slug. */}
        <Link
          href="#"
          className="text-body-s font-semibold text-creator hover:text-creator/80 transition-colors"
        >
          {t("help.guideLink")} →
        </Link>
      </section>
    </div>
  )
}

// ── Content state (creator con cosas) ─────────────────────────────────

interface ContentStateProps {
  locale: string
  grouped: Awaited<ReturnType<typeof getEventsByUserGrouped>>
  artists: Awaited<ReturnType<typeof getArtistsByUser>>
}

async function ContentState({ locale, grouped, artists }: ContentStateProps) {
  const t = await getTranslations({ locale, namespace: "dashboard" })
  const tStatus = await getTranslations({
    locale,
    namespace: "dashboard.events.status",
  })
  const tActions = await getTranslations({
    locale,
    namespace: "dashboard.artists.card.actions",
  })

  const upcoming = grouped.upcoming.slice(0, OVERVIEW_EVENTS_LIMIT)
  const visibleArtists = artists.slice(0, OVERVIEW_ARTISTS_LIMIT)
  const overflowEvents = grouped.upcoming.length > OVERVIEW_EVENTS_LIMIT
  const overflowArtists = artists.length > OVERVIEW_ARTISTS_LIMIT

  return (
    <div className="flex flex-col gap-3xl">
      <header className="flex flex-col gap-xs">
        <Eyebrow accent="creator">{t("overview.eyebrow")}</Eyebrow>
        <h1 className="text-display-m font-display text-fg-primary">
          {t("overview.title")}
        </h1>
        <p className="text-body-l text-fg-secondary">
          {t("overview.subtitleUpcoming")}: {grouped.upcoming.length} ·{" "}
          {t("overview.subtitleTotal")}: {grouped.all.length}
        </p>
      </header>

      {/* Mis eventos (próximos) */}
      <section className="flex flex-col gap-m">
        <SectionHeader
          title={t("overview.myEventsTitle")}
          action={
            <Link
              href="/dashboard/events/create"
              className="inline-flex items-center justify-center rounded-pill bg-creator text-on-creator font-semibold px-l py-s text-body-s hover:bg-creator/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-creator focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
            >
              {t("events.action.new")}
            </Link>
          }
        />
        {upcoming.length === 0 ? (
          <p className="text-body text-fg-secondary">
            {t("events.empty.upcoming")}
          </p>
        ) : (
          <ul className="flex flex-col gap-xs">
            {upcoming.map((event) => (
              <li key={event.id}>
                <EventRow
                  event={event}
                  locale={locale}
                  dashboard
                  statusBadge={{
                    label: tStatus("published"),
                    accent: "neutral",
                  }}
                  actions={
                    <EventRowActions
                      eventId={event.id}
                      eventSlug={event.slug}
                      locale={locale}
                    />
                  }
                />
              </li>
            ))}
          </ul>
        )}
        {overflowEvents ? (
          <Link
            href="/dashboard/events"
            className="self-start text-body-s font-semibold text-creator hover:text-creator/80 transition-colors"
          >
            {t("overview.viewAllEvents")} →
          </Link>
        ) : null}
      </section>

      {/* Mis artistas */}
      <section className="flex flex-col gap-m">
        <SectionHeader
          title={t("overview.myArtistsTitle")}
          action={
            <Link
              href="/dashboard/artists/create"
              className="inline-flex items-center justify-center rounded-pill bg-creator text-on-creator font-semibold px-l py-s text-body-s hover:bg-creator/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-creator focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
            >
              {t("artists.action.new")}
            </Link>
          }
        />
        {visibleArtists.length === 0 ? (
          <p className="text-body text-fg-secondary">{t("artists.empty")}</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-m">
            {visibleArtists.map((artist) => (
              <li key={artist.id}>
                <ArtistCard
                  artist={artist}
                  dashboard
                  actions={
                    <Link
                      href={`/dashboard/artists/${artist.id}/edit`}
                      className="inline-flex items-center justify-center rounded-pill bg-bg-page/85 backdrop-blur border border-border px-m py-xs text-body-s font-semibold text-fg-primary hover:bg-bg-page transition-colors"
                    >
                      {tActions("edit")}
                    </Link>
                  }
                />
              </li>
            ))}
          </ul>
        )}
        {overflowArtists ? (
          <Link
            href="/dashboard/artists"
            className="self-start text-body-s font-semibold text-creator hover:text-creator/80 transition-colors"
          >
            {t("overview.viewAllArtists")} →
          </Link>
        ) : null}
      </section>
    </div>
  )
}
