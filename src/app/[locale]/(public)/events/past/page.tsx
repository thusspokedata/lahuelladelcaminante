import { getTranslations } from "next-intl/server"
import { getPastEvents } from "@/services/events"
import { EventList } from "@/components/events/EventList"

export default async function PastEventsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "events" })
  const events = await getPastEvents()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("past")}</h1>
      <EventList events={events} />
    </div>
  )
}
