/** Loading de `/artists`: grid 4 columnas de ArtistCardSkeleton. */

import SkeletonBox from "@/components/ui/SkeletonBox"
import ArtistCardSkeleton from "@/components/artists/ArtistCardSkeleton"

export default function ArtistsLoading() {
  return (
    <div
      aria-hidden={true}
      className="max-w-7xl mx-auto px-m sm:px-l py-l lg:py-xl flex flex-col gap-l"
    >
      <div className="flex flex-col gap-s">
        <SkeletonBox aspectRatio="auto" className="h-4 w-32" />
        <SkeletonBox aspectRatio="auto" className="h-12 w-1/2 max-w-md" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-m">
        {Array.from({ length: 8 }).map((_, i) => (
          <ArtistCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
