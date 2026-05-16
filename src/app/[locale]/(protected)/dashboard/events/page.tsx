/**
 * `/dashboard/events` — listado de eventos del creator con tabs por estado.
 *
 * 4 tabs: Próximos / Borradores / Pasados / Todos. Cada tab renderiza la
 * lista de `EventRow` correspondiente (modo dashboard, con dropdown de
 * acciones). El bucket "Borradores" corresponde a eventos con
 * `isActive: false` (no publicados / despublicados).
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.
 */

import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { requireActive } from "@/services/auth"
import {
  getEventsByUserGrouped,
  type EventSummary,
} from "@/services/events"
import Eyebrow from "@/components/ui/Eyebrow"
import { EventRow } from "@/components/events/EventRow"
import EventRowActions from "@/components/dashboard/EventRowActions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TabKey = "upcoming" | "drafts" | "past" | "all"

export default async function DashboardEventsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { user } = await requireActive(locale)
  const grouped = await getEventsByUserGrouped(user.id)

  const t = await getTranslations({ locale, namespace: "dashboard.events" })
  const tStatus = await getTranslations({
    locale,
    namespace: "dashboard.events.status",
  })

  const tabs: Array<{
    key: TabKey
    label: string
    events: EventSummary[]
    badge: { label: string; accent: "brand" | "editorial" | "creator" | "neutral" }
    emptyKey: string
  }> = [
    {
      key: "upcoming",
      label: t("tabs.upcoming"),
      events: grouped.upcoming,
      badge: { label: tStatus("published"), accent: "neutral" },
      emptyKey: "empty.upcoming",
    },
    {
      key: "drafts",
      label: t("tabs.drafts"),
      events: grouped.drafts,
      badge: { label: tStatus("draft"), accent: "editorial" },
      emptyKey: "empty.drafts",
    },
    {
      key: "past",
      label: t("tabs.past"),
      events: grouped.past,
      badge: { label: tStatus("past"), accent: "neutral" },
      emptyKey: "empty.past",
    },
    {
      key: "all",
      label: t("tabs.all"),
      events: grouped.all,
      badge: { label: tStatus("published"), accent: "neutral" },
      emptyKey: "empty.all",
    },
  ]

  return (
    <div className="flex flex-col gap-l">
      <header className="flex flex-col gap-s sm:flex-row sm:items-end sm:justify-between sm:gap-m">
        <div className="flex flex-col gap-xs">
          <Eyebrow accent="creator">{t("eyebrow")}</Eyebrow>
          <h1 className="text-display-m font-display text-fg-primary">
            {t("title")}
          </h1>
          <p className="text-body-s text-fg-secondary">
            {grouped.upcoming.length} {t("countUpcoming")} ·{" "}
            {grouped.all.length} {t("countTotal")}
          </p>
        </div>
        <Link
          href="/dashboard/events/create"
          className="inline-flex items-center justify-center self-start sm:self-end rounded-pill bg-creator text-on-creator font-semibold px-l py-s text-body-s hover:bg-creator/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-creator focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
        >
          {t("action.new")}
        </Link>
      </header>

      <Tabs defaultValue="upcoming" className="flex flex-col gap-m">
        <TabsList variant="line" className="self-start gap-s overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              <span>
                {tab.label}{" "}
                <span className="text-fg-tertiary">({tab.events.length})</span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="flex flex-col gap-xs">
            {tab.events.length === 0 ? (
              <p className="text-body text-fg-secondary py-l">
                {t(tab.emptyKey)}
              </p>
            ) : (
              <ul className="flex flex-col gap-xs">
                {tab.events.map((event) => (
                  <li key={event.id}>
                    <EventRow
                      event={event}
                      locale={locale}
                      dashboard
                      statusBadge={tab.badge}
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
