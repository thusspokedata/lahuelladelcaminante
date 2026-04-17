import { getTranslations } from "next-intl/server"
import { requireActive, isCreatorOrAdmin } from "@/services/auth"
import { getEventsByUser } from "@/services/events"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { DashboardEventActions } from "@/components/dashboard/DashboardEventActions"

export default async function DashboardEventsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "dashboard" })
  const tCommon = await getTranslations({ locale, namespace: "common" })
  const tEvents = await getTranslations({ locale, namespace: "events" })
  const { user } = await requireActive(locale)
  const events = await getEventsByUser(user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.15em] mb-1">Dashboard</p>
          <h1 className="text-3xl font-black">{t("myEvents")}</h1>
        </div>
        {isCreatorOrAdmin(user.role) && (
          <Button asChild size="sm" className="rounded-full px-5">
            <Link href={`/${locale}/dashboard/events/create`}>{t("createEventBtn")}</Link>
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border-2 border-dashed border-border">
          <div className="text-5xl mb-4">🎸</div>
          <p className="text-muted-foreground font-medium">{t("noEventsYet")}</p>
          {isCreatorOrAdmin(user.role) && (
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
              <Link href={`/${locale}/dashboard/events/create`}>{t("createFirstEvent")}</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between border border-border rounded-xl px-4 py-3.5 bg-card shadow-sm gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">{event.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {event.dates[0] ? formatDate(event.dates[0], locale) : tEvents("noDate")} · {event.location}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {event.genre && <Badge variant="outline" className="hidden sm:inline-flex">{event.genre}</Badge>}
                <Button variant="ghost" size="sm" asChild className="rounded-full">
                  <Link href={`/${locale}/events/${event.slug}`}>{tCommon("view")}</Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="rounded-full">
                  <Link href={`/${locale}/dashboard/events/${event.id}/edit`}>{tCommon("edit")}</Link>
                </Button>
                <DashboardEventActions eventId={event.id} locale={locale} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
