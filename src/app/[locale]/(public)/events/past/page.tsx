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
    // Contenedor con las mismas clases de ancho / gutter / padding
    // vertical que `/events` y `/artists` — la página venía sin aire,
    // pegada a los bordes del viewport. (El header con banda de esas
    // páginas queda fuera de scope: acá solo se agrega el aire.)
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <h1 className="text-3xl font-bold">{t("past")}</h1>
      <EventList events={events} />
    </div>
  )
}
