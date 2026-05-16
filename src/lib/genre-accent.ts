/**
 * Mapeo género → accent del sistema de diseño.
 *
 * Los géneros en DB son strings libres (no enum), así que matcheamos por
 * substring case-insensitive contra una lista de keywords por accent.
 * Ejemplos:
 *  - "Cumbia", "cumbia", "Cumbia villera" → `creator` (todas matchean "cumbia").
 *  - "Latin Jazz" → `editorial` (matchea "jazz").
 *  - "Reggae" → `neutral` (no aparece en ningún bucket).
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §1.3.
 */

import type { AccentBound } from "@/components/types"

/** Keywords (todas en minúscula) por bucket. El matcheo es substring,
 * así que "Tango orquesta" o "Cumbia villera" caen en el mismo bucket
 * que la keyword base. */
const ACCENT_KEYWORDS: Record<AccentBound, readonly string[]> = {
  brand: ["tango", "folklore", "folclore", "andino"],
  creator: ["salsa", "cumbia", "bachata", "reggaeton", "reggaetón"],
  editorial: ["jazz", "bossa", "latin pop", "indie"],
}

/**
 * Devuelve el accent del sistema para un género dado.
 *  - `null`/vacío/no matchea ningún bucket → `"neutral"`.
 *  - Si matchea uno → ese.
 *  - Si matchea varios (ej. "Salsa Jazz") → gana el primero según el
 *    orden de `ACCENT_KEYWORDS` (brand > creator > editorial). En la
 *    práctica los géneros reales no se solapan tanto, pero el orden
 *    queda determinístico.
 */
export function genreAccent(
  genre: string | null | undefined
): AccentBound | "neutral" {
  if (!genre) return "neutral"
  const normalized = genre.toLowerCase()
  for (const [accent, keywords] of Object.entries(ACCENT_KEYWORDS) as Array<
    [AccentBound, readonly string[]]
  >) {
    if (keywords.some((kw) => normalized.includes(kw))) return accent
  }
  return "neutral"
}
