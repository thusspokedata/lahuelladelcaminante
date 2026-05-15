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

/** Subset de `Size` para componentes que no tienen variante grande
 * (ej. DateTile, Chip, ChipButton — donde una `l` no tiene sentido visual). */
export type SmallSize = Exclude<Size, "l">

/**
 * Convención de imports: importar componentes directamente desde su archivo
 * (`import BrandMark from "@/components/brand/BrandMark"`), no via barrels.
 * Esto preserva tree-shaking del default export en todos los bundlers.
 */
