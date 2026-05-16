/**
 * Loading de `/events/[slug]`: layout 5+7 (flyer izq + info derecha)
 * que imita la estructura del detalle real.
 */

import SkeletonBox from "@/components/ui/SkeletonBox"

export default function EventDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-m sm:px-l py-l lg:py-xl">
      <SkeletonBox aspectRatio="auto" className="h-4 w-24 mb-l" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
        <div className="lg:col-span-5">
          <SkeletonBox aspectRatio="4:5" variant="surface-3" />
        </div>

        <div className="lg:col-span-7 flex flex-col gap-l">
          {/* Chips */}
          <div className="flex flex-wrap gap-xs">
            <SkeletonBox aspectRatio="auto" className="h-6 w-16 rounded-pill" />
            <SkeletonBox aspectRatio="auto" className="h-6 w-24 rounded-pill" />
          </div>
          {/* Title + subtitle */}
          <div className="flex flex-col gap-s">
            <SkeletonBox aspectRatio="auto" className="h-12 w-5/6" />
            <SkeletonBox aspectRatio="auto" className="h-5 w-2/3" />
          </div>
          {/* Fact grid 2x2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-l">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-xs">
                <SkeletonBox aspectRatio="auto" className="h-3 w-20" />
                <SkeletonBox aspectRatio="auto" className="h-5 w-3/4" />
              </div>
            ))}
          </div>
          {/* CTA */}
          <SkeletonBox aspectRatio="auto" className="h-12 w-48 rounded-pill" />
          {/* About block */}
          <div className="flex flex-col gap-s">
            <SkeletonBox aspectRatio="auto" className="h-3 w-24" />
            <SkeletonBox aspectRatio="auto" className="h-4 w-full" />
            <SkeletonBox aspectRatio="auto" className="h-4 w-11/12" />
            <SkeletonBox aspectRatio="auto" className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  )
}
