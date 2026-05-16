/**
 * Helpers para re-hidratar `Date` después de pasar por `unstable_cache` de
 * Next.js. La cache serializa a JSON al guardar y NO convierte los strings
 * ISO de vuelta a `Date` al leer, así que cualquier valor `Date` declarado
 * en el tipo del servicio llega como `string` tras un cache hit.
 *
 * Convención: los services cacheados aplican `rehydrateDate`/`rehydrateDates`
 * en el wrapper post-cache para que los consumers reciban siempre `Date[]`
 * reales y no tengan que defenderse uno por uno.
 *
 * Llamar `rehydrateDate(date)` es seguro sobre un `Date` ya vivo (no-op +
 * validación) o sobre un `string` ISO (lo parsea); devuelve `null` para
 * inputs vacíos o no parseables.
 */

export function rehydrateDate(
  value: Date | string | null | undefined
): Date | null {
  if (!value) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export function rehydrateDates(
  values: ReadonlyArray<Date | string | null | undefined>
): Date[] {
  const out: Date[] = []
  for (const v of values) {
    const d = rehydrateDate(v)
    if (d) out.push(d)
  }
  return out
}
