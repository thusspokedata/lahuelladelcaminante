import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getArtistBySlug } from "@/services/artists"
import { getEventsByArtist } from "@/services/events"
import { EventList } from "@/components/events/EventList"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink } from "lucide-react"

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
  const images = artist.images ?? []

  return (
    <div>
      {/* Hero image (first photo, full bleed) */}
      <div className="relative w-full h-64 sm:h-80 bg-gradient-to-br from-primary/20 via-accent/10 to-background overflow-hidden">
        {images[0] ? (
          <Image
            src={images[0].url}
            alt={artist.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-10 select-none">🎵</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 -mt-10 relative">
        <Button variant="ghost" asChild className="mb-4 text-muted-foreground hover:text-foreground rounded-full -ml-2">
          <Link href={`/${locale}/artists`}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Artistas
          </Link>
        </Button>

        {/* Name + meta */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-2">{artist.name}</h1>
          {artist.origin && (
            <p className="text-muted-foreground text-lg mb-3">{artist.origin}</p>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {artist.genres.map((g) => (
              <Badge key={g} variant="secondary" className="rounded-full px-3">{g}</Badge>
            ))}
          </div>
          {/* Social links */}
          {social && (
            <div className="flex flex-wrap gap-3">
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Instagram
                </a>
              )}
              {social.spotify && (
                <a
                  href={social.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Spotify
                </a>
              )}
              {social.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> YouTube
                </a>
              )}
              {social.tiktok && (
                <a
                  href={social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> TikTok
                </a>
              )}
              {social.website && (
                <a
                  href={social.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Web
                </a>
              )}
            </div>
          )}
        </div>

        {/* Bio */}
        {artist.bio && (
          <p className="text-muted-foreground leading-relaxed text-base mb-10 max-w-2xl">
            {artist.bio}
          </p>
        )}

        {/* Photo gallery (all images) */}
        {images.length > 1 && (
          <section className="mb-12">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.15em] mb-4">Fotos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div
                  key={img.id}
                  className={`relative overflow-hidden rounded-xl bg-muted ${
                    i === 0 ? "col-span-2 sm:col-span-1 aspect-square" : "aspect-square"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? artist.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Events */}
        {events.length > 0 && (
          <section>
            <p className="text-xs font-bold text-primary uppercase tracking-[0.15em] mb-4">Próximos eventos</p>
            <EventList events={events} />
          </section>
        )}
      </div>
    </div>
  )
}
