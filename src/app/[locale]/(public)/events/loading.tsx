/**
 * Loading de `/events`: toolbar de filtros (chips placeholder) + grid
 * 6 EventCardSkeleton (mismo aspect 4:5 que `EventCard`).
 */

import SkeletonBox from "@/components/ui/SkeletonBox"
import EventCardSkeleton from "@/components/events/EventCardSkeleton"

export default function EventsLoading() {
  return (
    <div
      aria-hidden={true}
      className="max-w-7xl mx-auto px-m sm:px-l py-l lg:py-xl flex flex-col gap-l"
    >
      {/* Header */}
      <div className="flex flex-col gap-s">
        <SkeletonBox aspectRatio="auto" className="h-4 w-32" />
        <SkeletonBox aspectRatio="auto" className="h-12 w-2/3 max-w-xl" />
      </div>

      {/* Toolbar de chips filtro */}
      <div className="flex flex-wrap gap-s">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBox
            key={i}
            aspectRatio="auto"
            className="h-8 w-20 rounded-pill"
          />
        ))}
      </div>

      {/* Grid 6 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-m">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
