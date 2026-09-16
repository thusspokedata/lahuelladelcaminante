/**
 * flyer-extraction — módulo PURO (sin red) para extraer campos de un evento
 * a partir de un flyer con la Messages API de Anthropic.
 *
 * Qué vive acá:
 *  - Tipos (`Field<T>`, `ExtractedEvent`).
 *  - El prompt (`buildExtractionPrompt`) parametrizado por `locale`.
 *  - La tool de structured-output (`EXTRACT_EVENT_TOOL`) cuyo `input_schema`
 *    matchea `ExtractedEvent` — se usa con `tool_choice: { type: "tool" }`
 *    para forzar al modelo a devolver JSON en esa forma.
 *  - `parseExtraction(rawToolInput)` — valida/normaliza (zod) el `input` del
 *    bloque `tool_use`. NO hace red: esto es lo que testeamos.
 *
 * La llamada HTTP a Anthropic vive en el route handler
 * (`src/app/api/events/extract-from-flyer/route.ts`), no acá, para mantener
 * este módulo testeable sin mockear el SDK ni la red.
 *
 * El import del SDK es SOLO de tipos (`import type`), se borra en compile —
 * este módulo no arrastra el SDK a runtime ni al bundle de cliente (el form
 * lo importa con `import type` para el tipo `ExtractedEvent`).
 */
import type Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

/** Un campo extraído + si el valor fue inferido (vs. leído literal del flyer). */
export type Field<T> = { value: T; inferred: boolean }

export interface ExtractedEvent {
  title: Field<string>
  description: Field<string>
  venue: Field<string>
  city: Field<string>
  address: Field<string>
  organizer: Field<string>
  genres: Field<string[]>
  time: Field<string> // "HH:MM" o ""
  price: Field<string>
  dates: Field<string[]> // cada uno "YYYY-MM-DD"
}

/** Locales soportados por la UI del dashboard. */
export type ExtractLocale = "es" | "en" | "de"

const LOCALE_NAMES: Record<ExtractLocale, string> = {
  es: "Spanish (Rioplatense / español)",
  en: "English",
  de: "German (Deutsch)",
}

/**
 * Prompt de extracción. Reglas alineadas con el diseño del bot de Telegram
 * (`docs/superpowers/specs/2026-06-16-flyer-calendar-bot-design.md`) pero
 * extendido al set completo de campos del `Event` del sitio.
 */
export function buildExtractionPrompt(locale: ExtractLocale): string {
  const today = new Date().toISOString().slice(0, 10)
  return [
    "You are extracting structured event data from a concert/party flyer image for a Latin-American music events portal in Berlin.",
    "Call the extract_event tool exactly once with your best reading of the flyer.",
    "",
    "Rules:",
    "- Extract every field you can read directly from the flyer; set inferred=false for those.",
    "- For fields you reasonably infer rather than read verbatim (a short factual description, genres guessed from the music style or artists, the organizer), set inferred=true.",
    "- Write the description in " +
      LOCALE_NAMES[locale] +
      ": a short, factual 1-2 sentence blurb. No hype, no marketing adjectives, no exclamation marks.",
    "- genres: free strings, taken as-is from the flyer's own wording. Do NOT map to any predefined list.",
    "- dates: format each as YYYY-MM-DD. If the flyer shows a day/month but omits the year, infer the NEXT FUTURE occurrence relative to today (" +
      today +
      ") and set the dates field's inferred flag to true.",
    '- time: 24h "HH:MM", or "" if the flyer has no start time.',
    '- Any field that is not present and cannot be reasonably inferred: use "" (or [] for arrays) and inferred=false.',
    "- Never invent a specific venue, address, city or price that is not supported by the flyer.",
    "- If the flyer lists several events/dates for the same happening, put all the dates in the dates array.",
  ].join("\n")
}

/** Nombre de la tool — reusado por el route handler en `tool_choice`. */
export const EXTRACT_EVENT_TOOL_NAME = "extract_event"

const stringFieldSchema = {
  type: "object",
  properties: {
    value: { type: "string" },
    inferred: { type: "boolean" },
  },
  required: ["value", "inferred"],
  additionalProperties: false,
} as const

const stringArrayFieldSchema = {
  type: "object",
  properties: {
    value: { type: "array", items: { type: "string" } },
    inferred: { type: "boolean" },
  },
  required: ["value", "inferred"],
  additionalProperties: false,
} as const

/**
 * Tool de Anthropic con `input_schema` que replica `ExtractedEvent`. Forzada
 * con `tool_choice: { type: "tool", name: EXTRACT_EVENT_TOOL_NAME }` para que
 * el modelo devuelva SIEMPRE JSON en esta forma (enfoque robusto entre
 * versiones del SDK).
 */
export const EXTRACT_EVENT_TOOL: Anthropic.Tool = {
  name: EXTRACT_EVENT_TOOL_NAME,
  description:
    "Return the event fields read or inferred from the flyer image. Each field carries its value and whether that value was inferred rather than read verbatim.",
  input_schema: {
    type: "object",
    properties: {
      title: stringFieldSchema,
      description: stringFieldSchema,
      venue: stringFieldSchema,
      city: stringFieldSchema,
      address: stringFieldSchema,
      organizer: stringFieldSchema,
      genres: stringArrayFieldSchema,
      time: stringFieldSchema,
      price: stringFieldSchema,
      dates: stringArrayFieldSchema,
    },
    required: [
      "title",
      "description",
      "venue",
      "city",
      "address",
      "organizer",
      "genres",
      "time",
      "price",
      "dates",
    ],
    additionalProperties: false,
  },
}

// ── Normalización / parseo ────────────────────────────────────────────────

/** Extrae `{ value, inferred }` de un valor arbitrario devuelto por el modelo. */
function rawField(v: unknown): { value: unknown; inferred: boolean } {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>
    return { value: o.value, inferred: Boolean(o.inferred) }
  }
  // Tolerancia: el modelo devolvió el valor "pelado" (string/array) sin wrapper.
  return { value: v, inferred: false }
}

/** Campo string: coerce a `{ value: string, inferred }`. Vacío ⇒ inferred=false. */
const stringField = z.preprocess((v) => {
  const { value, inferred } = rawField(v)
  const s =
    typeof value === "string"
      ? value.trim()
      : value == null
        ? ""
        : String(value).trim()
  return { value: s, inferred: s === "" ? false : inferred }
}, z.object({ value: z.string(), inferred: z.boolean() }))

/** Campo array<string>: coerce, dropea no-strings/blancos. Vacío ⇒ inferred=false. */
const stringArrayField = z.preprocess((v) => {
  const { value, inferred } = rawField(v)
  const arr = Array.isArray(value)
    ? value
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim())
        .filter((x) => x.length > 0)
    : []
  return { value: arr, inferred: arr.length === 0 ? false : inferred }
}, z.object({ value: z.array(z.string()), inferred: z.boolean() }))

const baseSchema = z.object({
  title: stringField,
  description: stringField,
  venue: stringField,
  city: stringField,
  address: stringField,
  organizer: stringField,
  genres: stringArrayField,
  time: stringField,
  price: stringField,
})

const EMPTY_STRING_FIELD: Field<string> = { value: "", inferred: false }

/** Normaliza una fecha cruda a YYYY-MM-DD + si el año fue inferido. */
function normalizeDate(
  raw: string,
  today: Date
): { value: string; yearInferred: boolean } | null {
  const s = raw.trim()

  // Fecha completa YYYY-MM-DD (permitimos mes/día de 1-2 dígitos).
  const full = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (full) {
    const [, y, m, d] = full
    const month = Number(m)
    const day = Number(d)
    if (!isValidMonthDay(month, day)) return null
    return { value: `${y}-${pad(month)}-${pad(day)}`, yearInferred: false }
  }

  // Sin año: MM-DD ⇒ inferimos la próxima ocurrencia futura.
  const noYear = s.match(/^(\d{1,2})-(\d{1,2})$/)
  if (noYear) {
    const month = Number(noYear[1])
    const day = Number(noYear[2])
    if (!isValidMonthDay(month, day)) return null
    const year = nextFutureYear(month, day, today)
    return { value: `${year}-${pad(month)}-${pad(day)}`, yearInferred: true }
  }

  return null
}

function isValidMonthDay(month: number, day: number): boolean {
  return month >= 1 && month <= 12 && day >= 1 && day <= 31
}

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

/**
 * Devuelve el año de la próxima ocurrencia futura (>= hoy) de month-day.
 * Comparación en UTC para ser determinista (independiente de la zona).
 */
function nextFutureYear(month: number, day: number, today: Date): number {
  const todayUTC = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  )
  const year = today.getUTCFullYear()
  const candidate = Date.UTC(year, month - 1, day)
  return candidate >= todayUTC ? year : year + 1
}

function normalizeDatesField(v: unknown, today: Date): Field<string[]> {
  const { value, inferred } = rawField(v)
  const rawArr = Array.isArray(value) ? value : []
  const out: string[] = []
  let anyYearInferred = false

  for (const item of rawArr) {
    if (typeof item !== "string") continue
    const norm = normalizeDate(item, today)
    if (!norm) continue
    out.push(norm.value)
    if (norm.yearInferred) anyYearInferred = true
  }

  return {
    value: out,
    inferred: out.length === 0 ? false : Boolean(inferred) || anyYearInferred,
  }
}

/**
 * Valida/normaliza el `input` del bloque `tool_use` a un `ExtractedEvent`.
 * Puro y tolerante: cualquier campo ausente/inválido cae a vacío + inferred
 * false. Las fechas se normalizan a YYYY-MM-DD; si vienen sin año se infiere
 * la próxima ocurrencia futura relativa a `opts.today` (default: ahora) y el
 * campo `dates` queda marcado inferred.
 */
export function parseExtraction(
  rawToolInput: unknown,
  opts: { today?: Date } = {}
): ExtractedEvent {
  const today = opts.today ?? new Date()
  const obj =
    rawToolInput && typeof rawToolInput === "object"
      ? (rawToolInput as Record<string, unknown>)
      : {}

  const base = baseSchema
    .partial()
    .safeParse(obj)

  const b = base.success ? base.data : {}

  return {
    title: b.title ?? EMPTY_STRING_FIELD,
    description: b.description ?? EMPTY_STRING_FIELD,
    venue: b.venue ?? EMPTY_STRING_FIELD,
    city: b.city ?? EMPTY_STRING_FIELD,
    address: b.address ?? EMPTY_STRING_FIELD,
    organizer: b.organizer ?? EMPTY_STRING_FIELD,
    genres: b.genres ?? { value: [], inferred: false },
    time: b.time ?? EMPTY_STRING_FIELD,
    price: b.price ?? EMPTY_STRING_FIELD,
    dates: normalizeDatesField(obj.dates, today),
  }
}
