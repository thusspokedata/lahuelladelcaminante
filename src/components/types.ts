/**
 * Tipos compartidos entre componentes del sistema visual (PR 3).
 * Centralizados para mantener consistencia entre Chip, BrandMark, DateTile,
 * SectionHeader, FlyerImage, Eyebrow, etc.
 */

/** Roles de accent del sistema. `neutral` es la opción no-acentuada. */
export type Accent = "brand" | "editorial" | "creator" | "neutral"

/** Subset de `Accent` para casos donde no aplica el neutral
 * (ej. fallback de FlyerImage, tinte de SectionHeader). */
export type AccentBound = "brand" | "editorial" | "creator"

/** Escala de tamaños usada por componentes con tamaño variable. */
export type Size = "s" | "m" | "l"
