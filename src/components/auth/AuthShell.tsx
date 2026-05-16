/**
 * AuthShell — layout 7:5 (form izq · panel editorial der) para `/sign-in`
 * y `/sign-up`. Server component, sin estado.
 *
 * Specificaciones del handoff v2 (`docs/design/DESIGN_HANDOFF_OUTPUT_v2.md`
 * §1.1, §7):
 *  - Desktop (`lg:`): grid 12 columnas, form ocupa 7, hero ocupa 5.
 *  - Mobile (< 1024px): single column, hero hidden (`hidden lg:flex`).
 *    El form queda full-bleed con padding `l` lateral.
 *  - El form se centra adentro de su columna con `max-w-[440px]` para que
 *    los inputs no se estiren a 600px+ en pantallas anchas.
 *
 * El layout NO renderiza Header/Footer ni BrandLockup — eso lo maneja
 * `src/app/[locale]/(auth)/layout.tsx` (que envuelve a las páginas del
 * grupo `(auth)`). El AuthShell solo arma la grilla interna.
 *
 * `hero` se renderiza tal cual lo pase el caller — esto deja a cada
 * pantalla decidir si quiere mostrar 3 thumbnails de eventos, 3 step
 * cards del journey, una ilustración, o nada (`hero={null}` colapsaría
 * la columna pero hoy ningún caller lo necesita).
 */

import { cn } from "@/lib/utils"

export interface AuthShellProps {
  /** Slot izquierdo — el form de auth + headings + footer del form. */
  children: React.ReactNode
  /** Slot derecho — panel editorial. Se oculta en mobile. */
  hero: React.ReactNode
  className?: string
}

export default function AuthShell({
  children,
  hero,
  className,
}: AuthShellProps) {
  return (
    <div
      className={cn(
        // `4rem` = altura del mini-header del layout `(auth)` (`h-16`).
        // Sincronizado a mano — si cambia ahí, actualizar acá también.
        "grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-12",
        className
      )}
    >
      {/* Columna form — 7/12 en desktop. Centra el form en max-w-[440px]
          adentro de la columna para que no se estire en pantallas anchas. */}
      <section
        className="flex items-start justify-center px-l py-2xl lg:col-span-7 lg:items-center lg:py-3xl"
        aria-label="Formulario"
      >
        <div className="w-full max-w-[440px]">{children}</div>
      </section>

      {/* Columna hero — 5/12 en desktop, oculta en mobile.
          Surface elevada para distinguirla visualmente del form. */}
      <aside
        className="hidden bg-bg-surface lg:col-span-5 lg:flex lg:flex-col lg:justify-center lg:gap-xl lg:px-2xl lg:py-3xl"
        aria-label="Manifiesto"
      >
        {hero}
      </aside>
    </div>
  )
}
