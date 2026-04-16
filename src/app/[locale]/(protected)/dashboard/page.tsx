import { getTranslations } from "next-intl/server"
import { requireActive } from "@/services/auth"
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

  const [events, artists] = await Promise.all([
    getEventsByUser(user.id),
    (user.role === "artist" || user.role === "admin")
      ? getArtistsByUser(user.id)
      : Promise.resolve([]),
  ])

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("myEvents")}</h2>
          {(user.role === "artist" || user.role === "admin") && (
            <Button asChild size="sm">
              <Link href={`/${locale}/dashboard/events/create`}>+ Crear Evento</Link>
            </Button>
          )}
        </div>
        <EventList events={events.slice(0, 6)} />
      </section>

      {(user.role === "artist" || user.role === "admin") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("myArtists")}</h2>
            <Button asChild size="sm">
              <Link href={`/${locale}/dashboard/artists/create`}>+ Crear Artista</Link>
            </Button>
          </div>
          <ArtistList artists={artists} />
        </section>
      )}
    </div>
  )
}
