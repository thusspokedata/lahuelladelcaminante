/**
 * `getEventAccessMode` interpreta el campo libre `Event.price` (string que
 * llena el creator del evento) y lo clasifica en 5 modos de acceso. El
 * componente que renderiza el CTA decide cómo mostrar cada modo (texto,
 * estilo, traducción). Acá solo categorizamos y extraemos data útil.
 *
 *  - `tickets`   → hay URL externa (compra de entradas). `ticketUrl` se
 *                  extrae; `priceText` contiene el resto del string sin URL.
 *  - `voluntary` → "aporte"/"voluntario"/"spende"/"donation" en el texto.
 *  - `free`      → "libre"/"gratis"/"free"/"frei"/"kostenlos" en el texto.
 *  - `door`      → "puerta"/"door"/"abendkasse"/"kasse"/"tür" en el texto,
 *                  o número solo (precio sin URL).
 *  - `unknown`   → no matchea ninguna heurística. El componente debería
 *                  mostrar el `priceText` literal (texto original del creator)
 *                  + nota genérica "consultá al organizador".
 *
 * Reglas:
 *  - Matching case-insensitive sobre el string trimmed.
 *  - Las heurísticas se evalúan en orden: `voluntary` → `free` → `door`
 *    → número-solo → `unknown`. El orden importa para casos como "Eintritt
 *    frei an der Abendkasse" (alemán: entrada libre en la puerta), donde
 *    queremos `free` (lo más permisivo) antes que `door`.
 *  - URL gana sobre todo lo demás: aunque diga "aporte voluntario http://...",
 *    es `tickets` con `ticketUrl`. La intención de tener un link de compra
 *    pesa más que la categoría textual.
 *  - `priceText` cuando se devuelve es texto-as-is del creator (no se
 *    traduce). El componente lo muestra crudo.
 */

export type EventAccessMode = "tickets" | "voluntary" | "free" | "door" | "unknown"

export interface EventAccessInfo {
  mode: EventAccessMode
  /** URL externa de tickets. Solo presente cuando `mode === "tickets"`. */
  ticketUrl?: string
  /**
   * Texto a mostrar como precio o info adicional:
   *  - `tickets`: resto del string sin la URL.
   *  - `door`:    el número/precio escrito por el creator (ej. "€15").
   *  - `unknown`: el string completo original del creator.
   * No definido para `voluntary` / `free` — esos modos no necesitan precio.
   */
  priceText?: string
}

const URL_RE = /(https?:\/\/[^\s)]+)/i
// Precio "solo número" en formatos comunes de Berlín/Hamburgo/Múnich:
//   - símbolo prefijo o sufijo: "€15", "15€", "$ 20", "£10"
//   - decimales: "12,50", "10.5"
//   - notación DE sin decimales: "15,-" (15 euros exactos)
//   - código de moneda 3 letras: "EUR 15", "15 EUR", "USD 20"
const PRICE_ONLY_RE =
  /^(?:[€$£]\s*\d+(?:[.,]\d+|,-)?|\d+(?:[.,]\d+|,-)?\s*[€$£]?|(?:EUR|USD|GBP)\s*\d+(?:[.,]\d+|,-)?|\d+(?:[.,]\d+|,-)?\s*(?:EUR|USD|GBP))$/i

export function getEventAccessMode(price: string | null | undefined): EventAccessInfo {
  const raw = price?.trim() ?? ""
  if (raw === "") return { mode: "unknown" }

  const lower = raw.toLowerCase()

  // URL gana primero: la intención de venta de tickets externa es la señal
  // más fuerte. El priceText (resto del string sin URL) puede contener el
  // precio que el creator quiera mostrar al lado del botón.
  const urlMatch = raw.match(URL_RE)
  if (urlMatch) {
    const url = urlMatch[1]
    const rest = raw.replace(url, "").trim().replace(/^[-—–·:|]+\s*|\s*[-—–·:|]+$/g, "").trim()
    return {
      mode: "tickets",
      ticketUrl: url,
      priceText: rest || undefined,
    }
  }

  if (
    lower.includes("aporte") ||
    lower.includes("voluntari") || // voluntario / voluntary / voluntär
    lower.includes("spende") || // spendenbasis / spende
    lower.includes("donation") ||
    lower.includes("donativo")
  ) {
    return { mode: "voluntary" }
  }
  if (
    lower.includes("libre") ||
    lower.includes("gratis") ||
    lower.includes("kostenlos") ||
    /\bfree\b/.test(lower) ||
    /\bfrei\b/.test(lower) // alemán "frei" como palabra completa
  ) {
    return { mode: "free" }
  }
  if (
    lower.includes("puerta") ||
    lower.includes("abendkasse") ||
    /\bkasse\b/.test(lower) ||
    /\bdoor\b/.test(lower) ||
    /\btür\b/.test(lower)
  ) {
    return { mode: "door", priceText: raw }
  }
  if (PRICE_ONLY_RE.test(raw)) {
    return { mode: "door", priceText: raw }
  }

  // No matcheó nada: dejamos el texto original para que el componente lo
  // muestre como bloque informativo + nota genérica al lado.
  return { mode: "unknown", priceText: raw }
}
