/**
 * FormSection — bloque que agrupa fields del form bajo un eyebrow +
 * título + descripción opcional. Útil para forms largos como
 * `EventForm` (lo básico / cuándo / dónde / acceso / imagen) o
 * `ArtistForm` (identidad / bio / géneros / redes).
 *
 * Estructura visual:
 *  - Eyebrow mono uppercase con accent (default `brand`).
 *  - Título display-s (más chico que h1/h2 de páginas).
 *  - Descripción opcional con `text-body-s text-fg-secondary`.
 *  - `<div>` con los children (los `FormField`s).
 *
 * Server-compat, sin estado.
 *
 * Usa el `Accent` type compartido para que las secciones puedan teñirse
 * con `editorial` o `creator` si en algún form quieren contrastar
 * secciones distintas (default `brand`).
 */

import { cn } from "@/lib/utils"
import Eyebrow from "@/components/ui/Eyebrow"
import type { Accent } from "@/components/types"

export interface FormSectionProps {
  eyebrow: string
  title: string
  description?: string
  accent?: Accent
  children: React.ReactNode
  className?: string
}

export default function FormSection({
  eyebrow,
  title,
  description,
  accent = "brand",
  children,
  className,
}: FormSectionProps) {
  return (
    <section className={cn("flex flex-col gap-l", className)}>
      <header className="flex flex-col gap-xs">
        <Eyebrow accent={accent} as="p">
          {eyebrow}
        </Eyebrow>
        <h2 className="text-heading-m font-display text-fg-primary leading-tight">
          {title}
        </h2>
        {description ? (
          <p className="text-body-s text-fg-secondary leading-relaxed">
            {description}
          </p>
        ) : null}
      </header>

      <div className="flex flex-col gap-m">{children}</div>
    </section>
  )
}
