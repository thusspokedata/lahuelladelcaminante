import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getEventBySlug } from "@/services/events"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href={`/${locale}/events`}>← Volver</Link>
      </Button>

      {event.coverImage && (
        <div className="relative h-80 w-full rounded-xl overflow-hidden">
          <Image src={event.coverImage} alt={event.title} fill className="object-cover" />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          {event.genre && <Badge>{event.genre}</Badge>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">Fechas</p>
            {event.dates.map((d, i) => (
              <p key={i}>{formatDate(d, locale)}</p>
            ))}
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Lugar</p>
            <p>{event.location}</p>
          </div>
          {event.time && (
            <div>
              <p className="font-medium text-muted-foreground">Hora</p>
              <p>{event.time}</p>
            </div>
          )}
          {event.price && (
            <div>
              <p className="font-medium text-muted-foreground">Precio</p>
              <p>{event.price}</p>
            </div>
          )}
          {event.organizer && (
            <div>
              <p className="font-medium text-muted-foreground">Organizer</p>
              <p>{event.organizer}</p>
            </div>
          )}
        </div>

        {event.description && (
          <div className="prose prose-sm max-w-none">
            <p>{event.description}</p>
          </div>
        )}

        {event.artist && (
          <div className="border rounded-lg p-4 space-y-2">
            <p className="font-medium text-muted-foreground text-sm">Artista</p>
            <Link
              href={`/${locale}/artists/${event.artist.slug}`}
              className="text-lg font-semibold hover:underline"
            >
              {event.artist.name}
            </Link>
            {event.artist.origin && (
              <p className="text-sm text-muted-foreground">{event.artist.origin}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
