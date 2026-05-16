/**
 * GoogleGlyph — "G" tipográfica monospace dentro de un círculo con borde.
 *
 * **No** es el logo cuatricromático oficial de Google. Decisión explícita
 * del handoff (`docs/design/DESIGN_HANDOFF_OUTPUT_v2.md` §3.3):
 *  - Evita issues de licencia y atribución de marca.
 *  - Queda alineado al sistema visual del proyecto (mono + tokens neutros).
 *
 * Si en el futuro Google TOS exige el glyph oficial para botones de OAuth,
 * reemplazar el contenido de este componente por el SVG provisto por Google
 * sin tocar a los callers (OAuthButton lo consume por composición).
 *
 * Decorativo: `aria-hidden={true}` — el caller (`OAuthButton`) provee la
 * etiqueta semántica via el texto del botón ("Continuar con Google").
 */

import { cn } from "@/lib/utils"

export interface GoogleGlyphProps {
  className?: string
}

export default function GoogleGlyph({ className }: GoogleGlyphProps) {
  return (
    <span
      aria-hidden={true}
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full",
        "border border-border-hi font-mono text-body-s font-bold leading-none",
        "text-fg-primary",
        className
      )}
    >
      G
    </span>
  )
}
