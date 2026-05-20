/**
 * LegalShell — contenedor de las páginas legales (`/impressum`,
 * `/datenschutz`). Provee el ancho de lectura acotado, el header
 * editorial (eyebrow + título + nota opcional) y el espaciado entre
 * secciones. El contenido (las `LegalSection`) lo arma cada página.
 *
 * Server component — sin estado, solo layout.
 */

import type { ReactNode } from "react"
import Eyebrow from "@/components/ui/Eyebrow"

export interface LegalShellProps {
  eyebrow: string
  title: string
  /** Nota corta bajo el título. En las versiones ES/EN avisa que la
   * versión alemana es la legalmente vinculante; en DE no se pasa. */
  note?: string
  children: ReactNode
}

export default function LegalShell({
  eyebrow,
  title,
  note,
  children,
}: LegalShellProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-2xl px-m py-l sm:px-l lg:py-xl">
      <header className="flex flex-col gap-m">
        <Eyebrow accent="brand">{eyebrow}</Eyebrow>
        <h1 className="font-display text-display-m leading-[0.95] text-fg-primary sm:text-display-l">
          {title}
        </h1>
        {note ? (
          <p className="text-body-s leading-relaxed text-fg-tertiary">{note}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-xl">{children}</div>
    </div>
  )
}
