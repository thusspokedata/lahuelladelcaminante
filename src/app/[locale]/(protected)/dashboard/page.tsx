import { getTranslations } from "next-intl/server"
import { requireActive, isArtistOrAdmin } from "@/services/auth"
import { getEventsByUser } from "@/services/events"
import { getArtistsByUser } from "@/services/artists"
import { EventList } from "@/components/events/EventList"
import { ArtistList } from "@/components/artists/ArtistList"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "dashboard" })
  const { user } = await requireActive(locale)
  const canCreate = isArtistOrAdmin(user.role)

  const [events, artists] = await Promise.all([
    getEventsByUser(user.id),
    canCreate ? getArtistsByUser(user.id) : Promise.resolve([]),
  ])

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-bold text-primary uppercase tracking-[0.15em] mb-1">Panel</p>
        <h1 className="text-3xl font-black">{t("title")}</h1>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("myEvents")}</h2>
          {canCreate && (
            <Button asChild size="sm">
              <Link href={`/${locale}/dashboard/events/create`}>{t("createEventBtn")}</Link>
            </Button>
          )}
        </div>
        <EventList events={events.slice(0, 6)} />
      </section>

      {canCreate && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("myArtists")}</h2>
            <Button asChild size="sm">
              <Link href={`/${locale}/dashboard/artists/create`}>{t("createArtistBtn")}</Link>
            </Button>
          </div>
          <ArtistList artists={artists} />
        </section>
      )}
    </div>
  )
}
