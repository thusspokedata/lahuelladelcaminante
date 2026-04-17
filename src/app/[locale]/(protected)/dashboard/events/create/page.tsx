import { getTranslations } from "next-intl/server"
import { requireRole } from "@/services/auth"
import { getArtistsByUser } from "@/services/artists"
import { EventForm } from "@/components/events/EventForm"

export default async function CreateEventPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireRole("ARTIST", locale)
  const tForms = await getTranslations({ locale, namespace: "forms" })
  const artists = await getArtistsByUser(user.id)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold text-primary uppercase tracking-[0.15em] mb-1">Dashboard</p>
        <h1 className="text-3xl font-black">{tForms("createEvent")}</h1>
      </div>
      <EventForm artists={artists.map((a) => ({ id: a.id, name: a.name }))} />
    </div>
  )
}
