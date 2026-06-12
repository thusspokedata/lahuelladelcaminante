/**
 * Utilidades de géneros de evento.
 *
 * Los géneros son strings libres (no enum, no tabla catálogo). Para empujar
 * reutilización y minimizar duplicados semánticos ("Reggae" vs "reggae" vs
 * "Réggae"), todo el matcheo y la deduplicación se hacen sobre una forma
 * NORMALIZADA: minúsculas, sin acentos y con whitespace colapsado. La grafía
 * que se guarda/muestra es siempre la primera tal cual la tipeó el usuario.
 */

/** Lista curada base — semilla de sugerencias del combobox de género. El
 * catálogo "crece solo": las sugerencias reales son esta base unida a los
 * géneros ya usados en eventos. Mantener consistente con `genreAccent`. */
export const BASE_GENRES = [
  "Tango",
  "Salsa",
  "Cumbia",
  "Reggaeton",
  "Merengue",
  "Son Cubano",
  "Bossa Nova",
  "Vallenato",
  "Flamenco Latino",
  "Latin Jazz",
  "Folklore",
] as const

/**
 * Forma canónica para comparar dos géneros: minúsculas, sin diacríticos y
 * con el whitespace interno colapsado. NO es la forma que se guarda — solo
 * sirve para igualar/matchear. "Réggae ", "REGGAE", "reggae" → "reggae".
 */
export function normalizeGenre(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Limpia una lista de géneros para persistir: hace `trim`, descarta vacíos y
 * deduplica case/acento-insensitive conservando la PRIMERA grafía ingresada.
 * El orden relativo de los que sobreviven se mantiene.
 */
export function dedupeGenres(genres: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of genres) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const key = normalizeGenre(trimmed)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }
  return result
}

/**
 * Construye la lista de sugerencias para el form: une la base curada con los
 * géneros ya usados en eventos, deduplica (case/acento-insensitive) y ordena
 * alfabéticamente con `localeCompare` (acentos/locale-aware). Ante un choque
 * normalizado entre base y usado, gana la grafía de la base (se procesa primero).
 */
export function mergeGenreSuggestions(usedGenres: string[]): string[] {
  return dedupeGenres([...BASE_GENRES, ...usedGenres]).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  )
}
