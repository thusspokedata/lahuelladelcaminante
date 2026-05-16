/** Loading de `/dashboard/events`: tabs skeleton + lista de EventRow. */

import SkeletonBox from "@/components/ui/SkeletonBox"
import EventRowSkeleton from "@/components/events/EventRowSkeleton"

export default function DashboardEventsLoading() {
  return (
    <div className="flex flex-col gap-l">
      {/* Header + CTA */}
      <div className="flex flex-col gap-s sm:flex-row sm:items-end sm:justify-between sm:gap-m">
        <div className="flex flex-col gap-xs">
          <SkeletonBox aspectRatio="auto" className="h-4 w-32" />
          <SkeletonBox aspectRatio="auto" className="h-12 w-64" />
          <SkeletonBox aspectRatio="auto" className="h-4 w-48" />
        </div>
        <SkeletonBox aspectRatio="auto" className="h-10 w-40 rounded-pill self-start sm:self-end" />
      </div>

      {/* Tabs */}
      <div className="flex gap-s overflow-x-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox
            key={i}
            aspectRatio="auto"
            className="h-8 w-24 rounded-m shrink-0"
          />
        ))}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-xs">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
