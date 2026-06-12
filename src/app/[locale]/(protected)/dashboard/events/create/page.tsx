import { getTranslations } from "next-intl/server"
import { requireRole } from "@/services/auth"
import { getArtistsByUser } from "@/services/artists"
import { getGenreSuggestions } from "@/services/events"
import { EventForm } from "@/components/events/EventForm"
import Eyebrow from "@/components/ui/Eyebrow"

export default async function CreateEventPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireRole("creator", locale)
  const t = await getTranslations({ locale, namespace: "eventForm.create" })
  const [artists, genreSuggestions] = await Promise.all([
    getArtistsByUser(user.id),
    getGenreSuggestions(),
  ])

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex flex-col gap-xs">
        <Eyebrow accent="brand">{t("eyebrow")}</Eyebrow>
        <h1 className="text-display-m font-display text-fg-primary leading-tight">
          {t("title")}
        </h1>
      </header>
      <EventForm
        artists={artists.map((a) => ({ id: a.id, name: a.name }))}
        genreSuggestions={genreSuggestions}
      />
    </div>
  )
}
