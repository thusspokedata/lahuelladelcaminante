import { useTranslations } from "next-intl"
import { EventCard } from "./EventCard"
import type { EventSummary } from "@/services/events"

interface EventListProps {
  events: EventSummary[]
  /** Si el caller ya resolvió el locale, pasarlo evita que cada `EventCard`
   * lo resuelva por separado con `await getLocale()`. Recomendable cuando
   * el grid tiene más de 5 cards. */
  locale?: string
}

export function EventList({ events, locale }: EventListProps) {
  const t = useTranslations("events")

  if (events.length === 0) {
    return <p className="text-muted-foreground text-center py-12">{t("noEvents")}</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} locale={locale} />
      ))}
    </div>
  )
}
