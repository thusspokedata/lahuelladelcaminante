import Link from "next/link"
import Image from "next/image"
import { useLocale } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { ArtistSummary } from "@/services/artists"

interface ArtistCardProps {
  artist: ArtistSummary
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const locale = useLocale()

  return (
    <Link href={`/${locale}/artists/${artist.slug}`}>
      <Card className="hover:shadow-md transition-shadow overflow-hidden h-full">
        {artist.coverImage && (
          <div className="relative h-48 w-full">
            <Image
              src={artist.coverImage}
              alt={artist.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <h3 className="font-semibold text-lg">{artist.name}</h3>
          {artist.origin && (
            <p className="text-sm text-muted-foreground">{artist.origin}</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1">
          {artist.genres.map((genre) => (
            <Badge key={genre} variant="outline" className="text-xs">
              {genre}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </Link>
  )
}
