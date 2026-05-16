/**
 * FactGrid — bloque de info estructurada para detalle de evento.
 *
 * Cada celda: `Eyebrow` (label corto en mono mayúsculas) + valor (texto en
 * `fg-primary`). Layout 1 col mobile, 2 cols desktop (≥sm). Las celdas se
 * pueden omitir pasando `value` undefined/null — la grilla colapsa esos
 * espacios manteniendo el orden.
 *
 * Usado en `/events/[slug]` para el bloque CUÁNDO / HORARIO / DÓNDE /
 * DIRECCIÓN del fact grid 2×2 del handoff §3 — "Evento · detalle".
 */

import { cn } from "@/lib/utils"
import Eyebrow from "@/components/ui/Eyebrow"

export interface FactGridItem {
  /**
   * Identificador estable para el `key` de React. Requerido porque
   * los `label` pueden colisionar (dos celdas con el mismo eyebrow no
   * son inválidas) o cambiar por i18n entre renders — confiar en label
   * para el key arriesga bugs de reconciliación. Usar slugs como `"when"`,
   * `"timing"`, etc.
   */
  id: string
  /** Label corto del eyebrow (ej. "CUÁNDO"). */
  label: string
  /**
   * Valor a mostrar. Puede ser nodo React (links, spans con estilo, etc).
   * Si es `null`/`undefined`, la celda se omite — no se renderiza.
   */
  value: React.ReactNode | null | undefined
}

export interface FactGridProps {
  items: FactGridItem[]
  className?: string
}

export default function FactGrid({ items, className }: FactGridProps) {
  const visible = items.filter((it) => it.value != null && it.value !== "")
  if (visible.length === 0) return null

  return (
    <dl className={cn("grid grid-cols-1 sm:grid-cols-2 gap-l", className)}>
      {visible.map((item) => (
        // `<div>` agrupando `<dt>/<dd>` es permitido por HTML5 dentro de `<dl>`
        // y mantiene la asociación semántica de termino → valor.
        <div key={item.id} className="flex flex-col gap-xs">
          <Eyebrow as="dt">{item.label}</Eyebrow>
          <dd className="text-body text-fg-primary leading-snug">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
