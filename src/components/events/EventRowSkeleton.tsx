/**
 * EventRowSkeleton — placeholder de `EventRow` (variante densa
 * horizontal). Imita: DateTile chico izq + thumbnail 1:1 ~64px + 2
 * líneas centro + chip placeholder derecha.
 *
 * Server component.
 */

import { cn } from "@/lib/utils"
import SkeletonBox from "@/components/ui/SkeletonBox"

export interface EventRowSkeletonProps {
  className?: string
}

export default function EventRowSkeleton({ className }: EventRowSkeletonProps) {
  return (
    <article
      aria-hidden={true}
      className={cn(
        "flex items-center gap-m p-s rounded-m bg-bg-surface border border-border",
        className
      )}
    >
      <SkeletonBox aspectRatio="auto" className="shrink-0 w-12 h-12" />
      <SkeletonBox
        aspectRatio="1:1"
        variant="surface-3"
        className="shrink-0 w-[64px] hidden sm:block"
      />
      <div className="flex-1 min-w-0 flex flex-col gap-xs">
        <SkeletonBox aspectRatio="auto" className="h-4 w-3/4" />
        <SkeletonBox aspectRatio="auto" className="h-3 w-1/2" />
      </div>
      <SkeletonBox aspectRatio="auto" className="shrink-0 hidden md:block h-6 w-20 rounded-pill" />
    </article>
  )
}
