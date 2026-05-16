/**
 * Rate limit in-memory, IP-based. Sin Redis ni dependencias externas —
 * suficiente para el tráfico actual de un endpoint público chico como
 * `/api/contact`. Cuando crezca, swap a Upstash/Vercel KV (mantener
 * la API `checkRateLimit` para no tocar callers).
 *
 * Limitaciones conocidas (por diseño, no bugs):
 *  - El bucket vive en el process del runtime. En serverless con
 *    múltiples instancias (no es nuestro caso hoy en el VPS), un
 *    atacante distribuido en varias instancias podría saltarlo.
 *    Para el threat model actual (bot solo contra Resend quota), un
 *    rate limit por-instancia es suficiente.
 *  - El Map crece con cada IP nueva. Mitigación: cleanup oportunista
 *    al crear bucket nuevo (recorre el Map y borra expirados). En
 *    runs largos esto mantiene el Map en O(IPs activas en la ventana).
 *
 * Threat model que cubre:
 *  - Bot agresivo desde una IP única haciendo flood al endpoint.
 *  - Spam manual desde un browser (incluso saltándose origin/honeypot).
 *
 * Threat model que NO cubre:
 *  - Atacante con botnet rotando IPs. Para eso necesitamos captcha o
 *    fingerprinting de browser — fuera del scope de este PR.
 */

export interface RateLimitConfig {
  /** Ventana de tiempo en ms. */
  windowMs: number
  /** Requests máximos por bucket en la ventana. */
  maxRequests: number
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number }

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Default razonable para forms de contacto: 3 requests por minuto por
 * IP. Permite 3 envíos legítimos (probar / corregir / re-enviar) sin
 * bloquear, pero corta el flood básico. */
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 3,
}

/** Cleanup: recorre el Map y borra todos los expirados. Costo bajo
 * (Map.size típico < cantidad de IPs únicas en la ventana actual), y
 * la operación es O(n). Llamado al inicio de cada `checkRateLimit` —
 * garantiza limpieza periódica sin necesidad de `setInterval` ni
 * runtime separado. Antes corría solo "al crear bucket nuevo", lo que
 * dejaba un caso patológico: tráfico dominado por las mismas IPs nunca
 * disparaba cleanup. */
function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key)
    }
  }
}

/**
 * Verifica si una request del `key` (típicamente IP) puede pasar.
 * Side-effect: incrementa el contador si pasa, o devuelve cuánto esperar.
 *
 * En **development** (`NODE_ENV !== "production"`), si la `key` es
 * `"unknown"` (típicamente porque nginx no está delante seteando
 * `x-forwarded-for`), se hace **bypass** del rate limit. Evita el
 * caso "todos los requests del dev local caen en el mismo bucket
 * y se rate-limitean entre sí". En production NO hay bypass —
 * `"unknown"` sigue compartiendo bucket para defensa.
 *
 * Uso típico:
 * ```ts
 * const res = checkRateLimit(ip)
 * if (!res.ok) {
 *   return NextResponse.json({ error: "rate_limited" }, { status: 429,
 *     headers: { "Retry-After": String(res.retryAfterSec) } })
 * }
 * ```
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  if (process.env.NODE_ENV !== "production" && key === "unknown") {
    return { ok: true }
  }

  const now = Date.now()
  pruneExpired(now)
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs })
    return { ok: true }
  }

  if (bucket.count >= config.maxRequests) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }

  bucket.count += 1
  return { ok: true }
}

/**
 * Validación format-only de IPv4 e IPv6. NO valida ranges, reserved
 * blocks, ni semántica — solo "esto tiene forma de IP". Lo suficiente
 * para descartar strings arbitrarios inyectados como `x-forwarded-for`
 * en un setup mal configurado (sin nginx delante limpiando el header).
 *
 * - IPv4: 4 octets 0-255 separados por punto. Regex liberal (acepta
 *   ceros leading, ej. `001.002.003.004`); el goal es format, no
 *   canonicalización.
 * - IPv6: hex y `:`, con soporte para `::` compresión. Regex simple
 *   pero suficiente para descartar payload tipo `<script>` o `'OR 1=1`.
 */
const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/
const IPV6_RE = /^[0-9a-fA-F:]+$/

function isValidIp(value: string): boolean {
  if (IPV4_RE.test(value)) {
    return value
      .split(".")
      .every((oct) => {
        const n = Number(oct)
        return n >= 0 && n <= 255
      })
  }
  return IPV6_RE.test(value) && value.includes(":")
}

/** Extrae IP del request priorizando `x-forwarded-for` (set por nginx)
 * sobre `x-real-ip` (fallback). Valida formato antes de devolver — si
 * el header trae basura (atacante inyectando `x-forwarded-for: foo` en
 * un setup sin proxy delante), no la usamos como key del rate limit
 * (sería bypass trivial: rotar `x-forwarded-for` por cada request).
 *
 * Si nada pasa validación, devuelve "unknown" — agrupa todos los
 * anónimos bajo esa misma key. NO bloquea tráfico legítimo (browsers
 * reales detrás de nginx pasan IPs válidas) pero sí limita al atacante
 * con headers vacíos o inválidos.
 *
 * `x-forwarded-for` puede traer una lista `client, proxy1, proxy2` —
 * tomamos el primer valor (IP del cliente original). nginx en nuestro
 * setup ya agrega el correcto al principio. Si el repo cambia a estar
 * detrás de un CDN (Cloudflare, etc.), revisar este orden — algunos
 * CDNs agregan su edge al principio en lugar del final.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first && isValidIp(first)) return first
  }
  const realIp = headers.get("x-real-ip")?.trim()
  if (realIp && isValidIp(realIp)) return realIp
  return "unknown"
}
