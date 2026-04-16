import { getTranslations } from "next-intl/server"
import { getUpcomingEvents, getActiveGenres, getActiveCities } from "@/services/events"
import { EventList } from "@/components/events/EventList"
import { EventFilter } from "@/components/events/EventFilter"
import { Suspense } from "react"

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ genre?: string; city?: string }>
}) {
  const { locale } = await params
  const { genre, city } = await searchParams
  const t = await getTranslations({ locale, namespace: "events" })

  const [events, genres, cities] = await Promise.all([
    getUpcomingEvents({ genre, city }),
    getActiveGenres(),
    getActiveCities(),
  ])

  return (
    <div>
      {/* Page header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.18em] mb-1.5">
            Música latina en vivo · Alemania
          </p>
          <h1 className="text-4xl font-black">{t("title")}</h1>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <Suspense>
            <EventFilter genres={genres} cities={cities} />
          </Suspense>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <EventList events={events} />
      </div>
    </div>
  )
}
