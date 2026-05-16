/**
 * Loading del overview del dashboard. NO incluye sidebar — el sidebar
 * lo provee `dashboard/layout.tsx` con el shell real (no skeleton), así
 * que durante la carga la nav lateral ya está visible mientras solo el
 * `main` se rellena con este skeleton.
 *
 * Estructura imitada: header (eyebrow + h1 + counts) + 2 secciones
 * tipo "Mis próximos eventos" + "Mis artistas".
 */

import SkeletonBox from "@/components/ui/SkeletonBox"
import EventRowSkeleton from "@/components/events/EventRowSkeleton"
import ArtistCardSkeleton from "@/components/artists/ArtistCardSkeleton"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-3xl">
      {/* Header con counts */}
      <div className="flex flex-col gap-xs">
        <SkeletonBox aspectRatio="auto" className="h-4 w-24" />
        <SkeletonBox aspectRatio="auto" className="h-12 w-1/2 max-w-md" />
        <SkeletonBox aspectRatio="auto" className="h-5 w-2/3 max-w-sm" />
      </div>

      {/* Sección eventos */}
      <div className="flex flex-col gap-m">
        <div className="flex items-center justify-between">
          <SkeletonBox aspectRatio="auto" className="h-8 w-48" />
          <SkeletonBox aspectRatio="auto" className="h-10 w-36 rounded-pill" />
        </div>
        <div className="flex flex-col gap-xs">
          {Array.from({ length: 3 }).map((_, i) => (
            <EventRowSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Sección artistas */}
      <div className="flex flex-col gap-m">
        <div className="flex items-center justify-between">
          <SkeletonBox aspectRatio="auto" className="h-8 w-40" />
          <SkeletonBox aspectRatio="auto" className="h-10 w-36 rounded-pill" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-m">
          {Array.from({ length: 4 }).map((_, i) => (
            <ArtistCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
