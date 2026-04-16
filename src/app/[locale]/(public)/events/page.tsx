import { getTranslations } from "next-intl/server"
import { getUpcomingEvents } from "@/services/events"
import { EventList } from "@/components/events/EventList"
import { EventFilter } from "@/components/events/EventFilter"
import { Suspense } from "react"

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ genre?: string }>
}) {
  const { locale } = await params
  const { genre } = await searchParams
  const t = await getTranslations({ locale, namespace: "events" })
  const events = await getUpcomingEvents(genre ? { genre } : undefined)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Suspense>
          <EventFilter />
        </Suspense>
      </div>
      <EventList events={events} />
    </div>
  )
}
