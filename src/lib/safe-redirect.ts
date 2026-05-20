/**
 * Helpers para los redirects post-auth (sign-up / sign-in).
 *
 * El flujo `returnTo`: cuando el `proxy.ts` intercepta un acceso no
 * autenticado a una ruta protegida, redirige a `/sign-in` agregando un
 * `?returnTo=<ruta>`. Los forms de auth leen ese param y, tras
 * autenticarse, mandan al user de vuelta a donde quería ir. Si no hay
 * `returnTo`, el signup cae a la home y el sign-in al dashboard.
 *
 * El `returnTo` que produce el proxy es SIN prefijo de locale (ej.
 * `/dashboard`) — el router locale-aware de next-intl le re-agrega el
 * locale activo. Por eso estos helpers trabajan con rutas locale-less.
 *
 * Módulo puro (sin imports): se usa tanto en server components (las
 * pages de auth, donde se valida el param) como en client components
 * (los forms, para el `callbackURL` de OAuth).
 */

/** Tope de longitud defensivo para el `returnTo`. Una ruta interna real
 * nunca se acerca a esto; un valor más largo es input basura/hostil. */
const MAX_RETURN_TO_LENGTH = 512

/** True si `value` contiene algún carácter de control ASCII (U+0000–
 * U+001F) o DEL (U+007F). Se chequea con códigos en vez de un regex con
 * escapes de control para no meter bytes crudos en el fuente. */
function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code <= 0x1f || code === 0x7f) return true
  }
  return false
}

/**
 * Valida un `returnTo` (untrusted — viene de un query param) y devuelve
 * una ruta interna segura, o `null` si no lo es.
 *
 * Defensa contra open-redirect: sin esta validación un atacante podría
 * pasar `?returnTo=https://evil.com` o `?returnTo=//evil.com` y, al
 * usarlo en el redirect post-auth, mandaríamos al user a un dominio
 * externo (vector de phishing). Solo aceptamos rutas internas absolutas.
 *
 * Reglas (todas deben cumplirse):
 *  - Es un string no vacío y no supera `MAX_RETURN_TO_LENGTH`.
 *  - Empieza con `/` (ruta absoluta).
 *  - No contiene `//` en NINGUNA posición — `//evil.com` es una URL
 *    protocol-relative; un `//` interno (`/x//evil.com`) podría
 *    reinterpretarse como host si una capa downstream normaliza la ruta.
 *  - No contiene `\` — algunos browsers normalizan `\` a `/`, así que
 *    `/\evil.com` o `/x\@evil.com` podrían escapar.
 *  - No contiene `..` — path traversal: `/es/../evil` normaliza fuera
 *    del prefijo de locale. Una ruta interna real nunca trae `..`.
 *  - No contiene caracteres de control ni whitespace — evita
 *    contrabandear una segunda URL o romper el redirect.
 */
export function sanitizeReturnTo(
  value: string | null | undefined
): string | null {
  if (!value) return null
  if (value.length > MAX_RETURN_TO_LENGTH) return null
  if (!value.startsWith("/")) return null
  if (value.includes("//")) return null
  if (value.includes("\\")) return null
  if (value.includes("..")) return null
  if (hasControlChar(value)) return null
  if (/\s/.test(value)) return null
  return value
}

/**
 * Construye una URL interna locale-prefijada y segura. Se usa para el
 * `callbackURL` de OAuth (Better Auth hace un redirect directo del
 * browser, no pasa por el router de next-intl, así que necesita la ruta
 * con el locale ya incluido).
 *
 * Pasa `path` por `sanitizeReturnTo`: si no es una ruta interna válida,
 * cae a la home del locale. Así el resultado SIEMPRE es una ruta interna
 * de nuestro dominio — la función es segura aunque un caller futuro le
 * pase un `path` sin sanear (defensa en profundidad, no depende de la
 * disciplina del caller).
 *
 * `withLocale("es", "/")` → `/es`
 * `withLocale("es", "/dashboard")` → `/es/dashboard`
 * `withLocale("es", "https://evil.com")` → `/es` (input inválido → home)
 */
export function withLocale(locale: string, path: string): string {
  const safe = sanitizeReturnTo(path)
  if (!safe || safe === "/") return `/${locale}`
  return `/${locale}${safe}`
}
