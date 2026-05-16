/**
 * StatusHero — ícono visual central para `/user-pending` y `/user-blocked`.
 *
 * El handoff v2 §1.4, §1.5 pide un ícono que comunique el estado de
 * cuenta sin texto ni glyph reconocible:
 *  - `pending`: bombilla con glow dorado (radial gradient + box-shadow).
 *    Metáfora del "se está horneando" — la peña preparando el plato.
 *    Variante sutilmente cálida — distingue "estás esperando" de
 *    "fracasaste". Glow estático por ahora; el spec marca animación
 *    como opcional fuera del MVP.
 *  - `blocked`: círculo grande con borde sangre + em-dash centrado.
 *    Intencionalmente austero — sin emoji de alarma. Es estado
 *    terminal, no error técnico.
 *
 * Decorativo: `aria-hidden={true}`. El caller provee la etiqueta
 * semántica via eyebrow + h1 al lado/debajo.
 *
 * Server component — sin estado interno.
 */

import { cn } from "@/lib/utils"

export interface StatusHeroProps {
  variant: "pending" | "blocked"
  className?: string
}

export default function StatusHero({ variant, className }: StatusHeroProps) {
  if (variant === "pending") {
    return (
      <div
        aria-hidden={true}
        className={cn("flex items-center justify-center", className)}
      >
        <div
          className="relative flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 45%, var(--color-editorial) 0%, color-mix(in oklab, var(--color-editorial) 50%, transparent) 45%, transparent 75%)",
            boxShadow:
              "0 0 60px var(--color-editorial), 0 0 24px color-mix(in oklab, var(--color-editorial) 70%, transparent)",
          }}
        >
          {/* Punto central — el "filamento" de la bombilla. */}
          <span className="h-3 w-3 rounded-full bg-on-editorial" />
        </div>
      </div>
    )
  }

  // variant === "blocked"
  return (
    <div
      aria-hidden={true}
      className={cn("flex items-center justify-center", className)}
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-brand">
        <span className="select-none text-display-m font-display leading-none text-brand">
          —
        </span>
      </div>
    </div>
  )
}
