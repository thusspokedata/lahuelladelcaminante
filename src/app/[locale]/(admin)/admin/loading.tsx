/**
 * Loading genérico del panel admin. El admin no tiene rediseño todavía
 * (queda para PR 12), pero damos cobertura skeleton mínima para que las
 * pages de admin (applications, users, events) no parpadeen con
 * pantalla blanca durante las queries.
 *
 * Estructura imitada: header básico + tabla densa.
 */

import SkeletonBox from "@/components/ui/SkeletonBox"

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-l p-m">
      <div className="flex flex-col gap-xs">
        <SkeletonBox aspectRatio="auto" className="h-4 w-32" />
        <SkeletonBox aspectRatio="auto" className="h-10 w-1/2 max-w-md" />
      </div>

      <div className="flex flex-col gap-xs">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBox key={i} aspectRatio="auto" className="h-14 w-full" />
        ))}
      </div>
    </div>
  )
}
