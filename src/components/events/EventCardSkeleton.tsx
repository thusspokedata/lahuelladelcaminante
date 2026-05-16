/**
 * EventCardSkeleton — placeholder visual de `EventCard` para los
 * `loading.tsx` files. Imita la estructura del card real (flyer 4:5
 * arriba + bloque de info debajo) sin texto ni iconos.
 *
 * Server component. `aria-hidden` heredado de SkeletonBox para que el
 * screen reader no anuncie placeholders.
 */

import { cn } from "@/lib/utils"
import SkeletonBox from "@/components/ui/SkeletonBox"

export interface EventCardSkeletonProps {
  className?: string
}

export default function EventCardSkeleton({ className }: EventCardSkeletonProps) {
  return (
    <article
      aria-hidden
      className={cn(
        "flex flex-col h-full overflow-hidden rounded-l bg-bg-surface border border-border",
        className
      )}
    >
      <SkeletonBox aspectRatio="4:5" variant="surface-3" className="rounded-none" />
      <div className="flex flex-col gap-s p-m flex-1">
        <SkeletonBox aspectRatio="auto" className="h-3 w-1/3" />
        <SkeletonBox aspectRatio="auto" className="h-5 w-4/5" />
        <SkeletonBox aspectRatio="auto" className="h-4 w-2/3" />
      </div>
    </article>
  )
}
