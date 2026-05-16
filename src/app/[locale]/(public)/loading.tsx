/**
 * Loading genérico de cualquier ruta `(public)/**` que no tenga su
 * propio `loading.tsx`. Hero rectangular + 3 cards en grid + lista
 * compacta debajo — aproxima la estructura típica de las pages
 * públicas (home, listados).
 *
 * Server component, decorativo. No fetcha nada.
 */

import SkeletonBox from "@/components/ui/SkeletonBox"
import EventCardSkeleton from "@/components/events/EventCardSkeleton"
import EventRowSkeleton from "@/components/events/EventRowSkeleton"

export default function PublicLoading() {
  return (
    <div
      aria-hidden={true}
      className="max-w-7xl mx-auto px-m sm:px-l py-l lg:py-xl flex flex-col gap-3xl"
    >
      {/* Hero placeholder */}
      <div className="flex flex-col gap-m">
        <SkeletonBox aspectRatio="auto" className="h-4 w-40" />
        <SkeletonBox aspectRatio="auto" className="h-16 w-full max-w-3xl" />
        <SkeletonBox aspectRatio="auto" className="h-4 w-2/3 max-w-xl" />
      </div>

      {/* Grid de 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-m">
        {Array.from({ length: 3 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>

      {/* Lista compacta */}
      <div className="flex flex-col gap-xs">
        {Array.from({ length: 4 }).map((_, i) => (
          <EventRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
