/** Loading de `/dashboard/artists`: grid de ArtistCardSkeleton. */

import SkeletonBox from "@/components/ui/SkeletonBox"
import ArtistCardSkeleton from "@/components/artists/ArtistCardSkeleton"

export default function DashboardArtistsLoading() {
  return (
    <div aria-hidden={true} className="flex flex-col gap-l">
      <div className="flex flex-col gap-s sm:flex-row sm:items-end sm:justify-between sm:gap-m">
        <div className="flex flex-col gap-xs">
          <SkeletonBox aspectRatio="auto" className="h-4 w-32" />
          <SkeletonBox aspectRatio="auto" className="h-12 w-56" />
          <SkeletonBox aspectRatio="auto" className="h-4 w-40" />
        </div>
        <SkeletonBox
          aspectRatio="auto"
          className="h-10 w-40 rounded-pill self-start sm:self-end"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-m">
        {Array.from({ length: 6 }).map((_, i) => (
          <ArtistCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
