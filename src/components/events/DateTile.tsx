/**
 * DateTile — bloque "JUN 7" reutilizable. Mes en eyebrow (mono, mayúsculas)
 * encima del día en display weight derivado del token (`text-heading-*`).
 *
 * Usado sobre cards de evento, en el detalle, y en agendas compactas. El día
 * se formatea siempre con dos dígitos para alineación visual consistente.
 *
 * El mes respeta el locale. Para listings de muchos tiles, **pasar `locale`
 * explícito** (resuelto una vez en el page con `getLocale()`) en lugar de
 * dejar que cada tile lo pida solo — evita N awaits redundantes aunque
 * `next-intl` cachee por request. En usos sueltos, omitir `locale` es OK.
 *
 * En la práctica `JUN` coincide en es/en/de, pero `OCT` (es/en) vs `OKT`
 * (de) sí difiere, así que delegamos a `Intl.DateTimeFormat`.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

import { getLocale } from "next-intl/server"
import { cn } from "@/lib/utils"
import type { AccentBound, SmallSize } from "@/components/types"

export interface DateTileProps {
  date: Date | string
  size?: SmallSize
  accent?: AccentBound
  locale?: string
  className?: string
}

const LOCALE_MAP: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  de: "de-DE",
}

const ACCENT_BG: Record<AccentBound, string> = {
  brand: "bg-brand text-on-brand",
  editorial: "bg-editorial text-on-editorial",
  creator: "bg-creator text-on-creator",
}

export default async function DateTile({
  date,
  size = "m",
  accent,
  locale,
  className,
}: DateTileProps) {
  const resolvedLocale = locale ?? (await getLocale())
  const d = typeof date === "string" ? new Date(date) : date
  const isValid = !isNaN(d.getTime())

  const month = isValid
    ? new Intl.DateTimeFormat(LOCALE_MAP[resolvedLocale] ?? "es-ES", {
        month: "short",
      })
        .format(d)
        .replace(/\./g, "")
        .toUpperCase()
        .slice(0, 3)
    : "—"
  const day = isValid ? String(d.getDate()).padStart(2, "0") : "—"

  const colors = accent ? ACCENT_BG[accent] : "bg-bg-surface-2 text-fg-primary"
  // El peso del día viene del propio token `text-heading-*` (700 / 800).
  const dayClass = size === "m" ? "text-heading-l" : "text-heading-m"

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-m px-s py-xs w-fit",
        colors,
        className
      )}
      aria-label={isValid ? `${month} ${day}` : undefined}
    >
      <span className="text-eyebrow font-mono">{month}</span>
      <span className={cn(dayClass, "font-display")}>{day}</span>
    </div>
  )
}
