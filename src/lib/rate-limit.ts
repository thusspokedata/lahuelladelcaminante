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

/** Extrae IP del request priorizando `x-forwarded-for` (set por nginx)
 * sobre `x-real-ip` (fallback). Si ambos faltan, devuelve "unknown" —
 * el rate limit agrupa todos los anónimos bajo esa misma key, lo que
 * NO bloquea tráfico legítimo (browsers reales siempre pasan headers)
 * pero sí limita a un atacante que pase los headers vacíos.
 *
 * `x-forwarded-for` puede traer una lista `client, proxy1, proxy2` —
 * tomamos el primer valor (el IP del cliente original). nginx en
 * nuestro setup ya agrega el correcto al principio.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "unknown"
}
