/**
 * ArtistCardSkeleton — placeholder de `ArtistCard`. Portrait 1:1 arriba
 * + 2 líneas debajo (nombre + origen).
 *
 * Server component.
 */

import { cn } from "@/lib/utils"
import SkeletonBox from "@/components/ui/SkeletonBox"

export interface ArtistCardSkeletonProps {
  className?: string
}

export default function ArtistCardSkeleton({ className }: ArtistCardSkeletonProps) {
  return (
    <article
      aria-hidden
      className={cn(
        "flex flex-col h-full overflow-hidden rounded-l bg-bg-surface border border-border",
        className
      )}
    >
      <SkeletonBox aspectRatio="1:1" variant="surface-3" className="rounded-none" />
      <div className="flex flex-col gap-s p-m flex-1">
        <SkeletonBox aspectRatio="auto" className="h-5 w-3/4" />
        <SkeletonBox aspectRatio="auto" className="h-3 w-1/2" />
      </div>
    </article>
  )
}
