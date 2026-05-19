import { getTranslations } from "next-intl/server"
import { notFound, redirect } from "next/navigation"
import { requireActive, canEditEvent } from "@/services/auth"
import { getArtistsByUser } from "@/services/artists"
import { prisma } from "@/lib/prisma"
import { EventForm } from "@/components/events/EventForm"
import Eyebrow from "@/components/ui/Eyebrow"

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const { user } = await requireActive(locale)
  const t = await getTranslations({ locale, namespace: "eventForm.edit" })

  const canEdit = await canEditEvent(id)
  if (!canEdit) redirect(`/${locale}/dashboard`)

  const [event, userArtists] = await Promise.all([
    prisma.event.findUnique({
      where: { id, isDeleted: false },
      include: {
        dates: { orderBy: { date: "asc" } },
        images: { select: { id: true, url: true, publicId: true } },
      },
    }),
    getArtistsByUser(user.id),
  ])

  if (!event) notFound()

  // Split location into venue + city (format: "Venue, City")
  const locationParts = event.location.split(",").map((s: string) => s.trim())
  const city = locationParts.length > 1 ? locationParts[locationParts.length - 1] : ""
  const venue = locationParts.length > 1 ? locationParts.slice(0, -1).join(", ") : event.location

  const defaultValues = {
    title: event.title,
    description: event.description ?? "",
    venue,
    city,
    address: event.address ?? "",
    organizer: event.organizer ?? "",
    genre: event.genre ?? "",
    time: event.time ?? "",
    price: event.price ?? "",
    artistId: event.artistId ?? "",
    dates: event.dates.map((d: { date: Date }) => d.date.toISOString()),
    images: event.images,
  }

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex flex-col gap-xs">
        <Eyebrow accent="brand">{t("eyebrow")}</Eyebrow>
        <h1 className="text-display-m font-display text-fg-primary leading-tight">
          {event.title}
        </h1>
      </header>
      <EventForm
        eventId={id}
        defaultValues={defaultValues}
        artists={userArtists.map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  )
}
