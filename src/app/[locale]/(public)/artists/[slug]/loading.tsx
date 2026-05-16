/** Loading de `/artists/[slug]`: layout 5+7 con portrait. */

import SkeletonBox from "@/components/ui/SkeletonBox"
import EventCardSkeleton from "@/components/events/EventCardSkeleton"

export default function ArtistDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-m sm:px-l py-l lg:py-xl">
      <SkeletonBox aspectRatio="auto" className="h-4 w-24 mb-l" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
        <div className="lg:col-span-5">
          <SkeletonBox aspectRatio="4:5" variant="surface-3" />
        </div>

        <div className="lg:col-span-7 flex flex-col gap-l">
          <SkeletonBox aspectRatio="auto" className="h-4 w-48" />
          <SkeletonBox aspectRatio="auto" className="h-14 w-3/4" />
          {/* Bio (max-w-2xl en el real) */}
          <div className="flex flex-col gap-s max-w-2xl">
            <SkeletonBox aspectRatio="auto" className="h-4 w-full" />
            <SkeletonBox aspectRatio="auto" className="h-4 w-full" />
            <SkeletonBox aspectRatio="auto" className="h-4 w-11/12" />
            <SkeletonBox aspectRatio="auto" className="h-4 w-3/4" />
          </div>
          {/* Chips géneros */}
          <div className="flex flex-wrap gap-xs">
            <SkeletonBox aspectRatio="auto" className="h-6 w-20 rounded-pill" />
            <SkeletonBox aspectRatio="auto" className="h-6 w-24 rounded-pill" />
          </div>
          {/* Redes */}
          <div className="flex flex-wrap gap-s">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBox
                key={i}
                aspectRatio="auto"
                className="h-9 w-28 rounded-pill"
              />
            ))}
          </div>
          {/* Próximas fechas */}
          <div className="flex flex-col gap-m">
            <SkeletonBox aspectRatio="auto" className="h-3 w-32" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-m">
              {Array.from({ length: 2 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
