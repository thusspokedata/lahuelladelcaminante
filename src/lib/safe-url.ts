/**
 * Validador de URLs externas. Los campos `Event.price` (puede contener
 * URL de tickets) y `Artist.socialMedia` (objeto plataforma→URL) los llena
 * el creator como texto libre — si entra `javascript:alert(1)` o
 * `data:text/html,...`, renderizarlo crudo en un `<a href>` ejecuta el
 * payload. Acotamos a `http:` / `https:` como única opción aceptable
 * para anclas externas.
 *
 * Devuelve `true` solo si la URL parsea Y su protocolo es http/https.
 * Cualquier otro caso (string vacío, malformado, schemes peligrosos)
 * devuelve `false`. El consumidor decide qué hacer con un `false`
 * (típicamente: omitir el link entero).
 */

export function isSafeHttpUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false
  try {
    const parsed = new URL(url.trim())
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}
