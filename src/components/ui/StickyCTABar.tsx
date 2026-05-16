/**
 * StickyCTABar — wrapper que fija un CTA al fondo del viewport en mobile y
 * lo oculta en desktop (donde el CTA del body principal ya es visible).
 *
 * No es client en sí — solo aplica utilities. Lo dejamos como server
 * component minimalista para que pueda envolver children async (ej.
 * `EventAccessCTA` que es async server). El sticky es puro CSS (`fixed`
 * con `bottom-0`) y no necesita JS.
 *
 * Visual: barra full-width con borde superior + backdrop blur sutil, para
 * separarla del contenido scrolleado. Se oculta en ≥lg (1024px) porque a
 * partir de ese breakpoint la columna derecha del detalle ya tiene el CTA
 * principal visible sin scroll.
 */

import { cn } from "@/lib/utils"

export interface StickyCTABarProps {
  children: React.ReactNode
  className?: string
}

export default function StickyCTABar({ children, className }: StickyCTABarProps) {
  return (
    <div
      className={cn(
        // `z-30` queda explícitamente por debajo del drawer/backdrop del
        // Header (`z-50`/`z-40`) para evitar clash visual cuando el menú
        // mobile está abierto.
        "fixed bottom-0 inset-x-0 z-30 lg:hidden",
        "bg-bg-page/95 backdrop-blur border-t border-border",
        "px-m py-s pb-[max(env(safe-area-inset-bottom),0.5rem)]",
        className
      )}
    >
      {children}
    </div>
  )
}
