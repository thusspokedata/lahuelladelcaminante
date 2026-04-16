import { getTranslations } from "next-intl/server"
import { requireActive } from "@/services/auth"
import { getEventsByUser } from "@/services/events"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default async function DashboardEventsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "dashboard" })
  const { user } = await requireActive(locale)
  const events = await getEventsByUser(user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("myEvents")}</h1>
        {(user.role === "artist" || user.role === "admin") && (
          <Button asChild size="sm">
            <Link href={`/${locale}/dashboard/events/create`}>+ Crear Evento</Link>
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground">No tienes eventos aún.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="flex items-center justify-between border rounded-lg px-4 py-3 bg-card">
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {event.dates[0] ? formatDate(event.dates[0], locale) : "Sin fecha"} · {event.location}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {event.genre && <Badge variant="outline">{event.genre}</Badge>}
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${locale}/events/${event.slug}`}>Ver</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
