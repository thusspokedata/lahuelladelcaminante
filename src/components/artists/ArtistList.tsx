import { useTranslations } from "next-intl"
import { ArtistCard } from "./ArtistCard"
import type { ArtistSummary } from "@/services/artists"

interface ArtistListProps {
  artists: ArtistSummary[]
}

export function ArtistList({ artists }: ArtistListProps) {
  const t = useTranslations("artists")

  if (artists.length === 0) {
    return <p className="text-muted-foreground text-center py-12">{t("noArtists")}</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  )
}
