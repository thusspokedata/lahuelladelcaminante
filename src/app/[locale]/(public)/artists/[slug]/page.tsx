import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getArtistBySlug } from "@/services/artists"
import { getEventsByArtist } from "@/services/events"
import { EventList } from "@/components/events/EventList"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const artist = await getArtistBySlug(slug)

  if (!artist) notFound()

  const events = await getEventsByArtist(artist.id)
  const social = artist.socialMedia as Record<string, string> | null

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href={`/${locale}/artists`}>← Artistas</Link>
      </Button>

      <div className="flex gap-6 flex-wrap">
        {artist.coverImage && (
          <div className="relative h-40 w-40 rounded-full overflow-hidden flex-shrink-0">
            <Image src={artist.coverImage} alt={artist.name} fill className="object-cover" />
          </div>
        )}
        <div className="space-y-3 flex-1">
          <h1 className="text-3xl font-bold">{artist.name}</h1>
          {artist.origin && (
            <p className="text-muted-foreground">{artist.origin}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {artist.genres.map((g) => (
              <Badge key={g} variant="secondary">{g}</Badge>
            ))}
          </div>
          {social && (
            <div className="flex gap-3 text-sm">
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">Instagram</a>
              )}
              {social.spotify && (
                <a href={social.spotify} target="_blank" rel="noopener noreferrer" className="hover:underline">Spotify</a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="hover:underline">YouTube</a>
              )}
              {social.website && (
                <a href={social.website} target="_blank" rel="noopener noreferrer" className="hover:underline">Web</a>
              )}
            </div>
          )}
        </div>
      </div>

      {artist.bio && <p className="text-muted-foreground leading-relaxed">{artist.bio}</p>}

      {events.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Eventos</h2>
          <EventList events={events} />
        </section>
      )}
    </div>
  )
}
