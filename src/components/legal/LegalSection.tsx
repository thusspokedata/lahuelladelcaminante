/**
 * LegalSection — una sección de una página legal: un `<h2>` + el cuerpo.
 * Los párrafos del cuerpo los pasa la página como `children` (texto
 * resuelto vía i18n). Server component, presentacional.
 */

import type { ReactNode } from "react"

export interface LegalSectionProps {
  heading: string
  children: ReactNode
}

export default function LegalSection({
  heading,
  children,
}: LegalSectionProps) {
  return (
    <section className="flex flex-col gap-s">
      <h2 className="font-display text-heading-s text-fg-primary">{heading}</h2>
      <div className="flex flex-col gap-s text-body-s leading-relaxed text-fg-secondary">
        {children}
      </div>
    </section>
  )
}
