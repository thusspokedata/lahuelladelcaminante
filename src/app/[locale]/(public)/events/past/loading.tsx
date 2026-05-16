/**
 * Loading de `/events/past`: igual que `events/loading.tsx` pero
 * atenuado (`opacity-60`) para simular el tono "pasado" de la página
 * — el contenido real también va a venir más muteado visualmente.
 */

import SkeletonBox from "@/components/ui/SkeletonBox"
import EventCardSkeleton from "@/components/events/EventCardSkeleton"

export default function EventsPastLoading() {
  return (
    <div
      aria-hidden={true}
      className="max-w-7xl mx-auto px-m sm:px-l py-l lg:py-xl flex flex-col gap-l opacity-60"
    >
      <div className="flex flex-col gap-s">
        <SkeletonBox aspectRatio="auto" className="h-4 w-32" />
        <SkeletonBox aspectRatio="auto" className="h-12 w-2/3 max-w-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-m">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
