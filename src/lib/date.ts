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

// ── Timezone helpers (Europe/Berlin) ──────────────────────────────────
//
// El portal opera en Berlín y todos los eventos viven en ese huso. Las
// fechas de evento se guardan como `TIMESTAMP` sin zona (Prisma `DateTime`
// → Postgres `TIMESTAMP`); el form acaba enviando la medianoche UTC del
// día calendario elegido, lo cual en Berlín verano (CEST UTC+2) equivale a
// las 02:00 AM de ese día. Si los services comparan contra `new Date()`
// (instante exacto), cualquier evento del día actual "expira" a las
// 02:00 AM Berlín y migra incorrectamente a "pasados" — bug observado
// y diagnosticado.
//
// Solución (Opción A del diagnóstico): comparar contra el INICIO DEL DÍA
// CALENDARIO en Berlín. Un evento es "próximo/vigente" mientras su fecha
// caiga en hoy o futuro (día calendario), y "pasado" recién a partir de
// medianoche Berlín del día siguiente.
//
// CEST/CET (horario de verano) se resuelve via `Intl.DateTimeFormat` con
// `timeZone: "Europe/Berlin"` — no hardcodeamos offset.

export const BERLIN_TZ = "Europe/Berlin"

/**
 * Devuelve la fecha calendario (YYYY-MM-DD) correspondiente al instante
 * `d` visto en hora de Berlín. Helper interno usado por `startOfTodayBerlin`
 * y `isTodayBerlin`. `en-CA` produce el formato ISO sin reordenar.
 */
function berlinDateString(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

/**
 * Convierte una fecha-hora local en Berlín (string ISO sin zona, ej.
 * "2026-05-24T00:00:00") al `Date` UTC correspondiente. Funciona en CEST
 * y CET sin hardcodear el offset:
 *  1. Interpreta el string como si fuera UTC ("naïve parse").
 *  2. Pregunta a Intl qué hora marca ese instante en Berlín.
 *  3. La diferencia es el offset de Berlín en ese momento.
 *  4. Resta el offset al instante original para obtener el UTC real.
 */
function berlinLocalToUtc(localISO: string): Date {
  const asIfUtc = new Date(`${localISO}Z`)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BERLIN_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(asIfUtc)
  const get = (t: string) =>
    parseInt(parts.find((p) => p.type === t)!.value, 10)
  // Algunas implementaciones devuelven "24" para medianoche → normalizar.
  const hour = get("hour") % 24
  const tzAsIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hour,
    get("minute"),
    get("second")
  )
  const offsetMs = tzAsIfUtc - asIfUtc.getTime()
  return new Date(asIfUtc.getTime() - offsetMs)
}

/**
 * Instante UTC correspondiente a las 00:00 de HOY en hora de Berlín.
 * Para filtrar eventos: usar este valor en lugar de `new Date()` permite
 * que un evento de hoy se considere "próximo/vigente" durante todo el
 * día calendario Berlín, no solo hasta las 02:00 AM (caso CEST) /
 * 01:00 AM (caso CET).
 *
 * Ejemplos (CEST, mayo, UTC+2):
 *   2026-05-24 09:00 Berlin → 2026-05-23T22:00:00.000Z
 * Ejemplos (CET, enero, UTC+1):
 *   2026-01-15 09:00 Berlin → 2026-01-14T23:00:00.000Z
 */
export function startOfTodayBerlin(): Date {
  const today = berlinDateString(new Date())
  return berlinLocalToUtc(`${today}T00:00:00`)
}

/**
 * `true` si `d` cae en el mismo día calendario Berlín que ahora. Usado
 * en el home para marcar eventos de hoy con el badge "HOY".
 */
export function isTodayBerlin(d: Date): boolean {
  return berlinDateString(d) === berlinDateString(new Date())
}

/**
 * Último instante del día calendario Berlín `days` días después de hoy
 * (INCLUSIVE). Pensado como bound superior para filtros tipo "eventos
 * dentro de los próximos N días" — sirve tanto en queries Prisma (con
 * `lte`) como en comparaciones en memoria contra `event.dates[0]`.
 *
 * Las fechas de evento se guardan como `00:00 UTC` del día calendario,
 * así que el bound se extiende al fin del día N para capturar esos
 * eventos. `+(days+1)*24h - 1ms` es equivalente a `startOfBerlinDay(today+N+1) - 1ms`
 * para días sin transición DST en la ventana.
 */
export function endOfDayBerlinPlus(days: number): Date {
  return new Date(
    startOfTodayBerlin().getTime() + (days + 1) * 24 * 60 * 60 * 1000 - 1
  )
}
