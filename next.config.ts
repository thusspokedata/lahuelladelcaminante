import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const isDev = process.env.NODE_ENV !== "production"

/**
 * CSP en modo report-only.
 *
 * Decisión cerrada del PR (Obj 3): primero observamos violaciones en
 * production con `Content-Security-Policy-Report-Only` durante 1-2
 * semanas, después promovemos a enforcement (`Content-Security-Policy`)
 * en un PR siguiente cuando sabemos qué orígenes legítimos faltan.
 *
 * Notas por directiva:
 *  - `script-src 'unsafe-inline'`: Next.js requiere inline scripts para
 *    el runtime client. Habilitable solo bajando a `'strict-dynamic'`
 *    con nonces, ruta no trivial en App Router; aceptado por ahora.
 *  - `'unsafe-eval'`: solo en dev porque turbopack lo necesita para HMR.
 *    Production no lo lleva.
 *  - `style-src 'unsafe-inline'`: shadcn/Tailwind/next-intl insertan
 *    estilos inline. Sin esto el sitio se rompe visual.
 *  - `img-src res.cloudinary.com`: serving de imágenes.
 *  - `connect-src api.cloudinary.com`: uploads directos desde browser.
 *  - `connect-src ws: wss:` solo en dev para HMR.
 *  - `frame-ancestors 'none'` redundante con `X-Frame-Options: DENY`
 *    pero recomendado por OWASP — CSP wins en browsers modernos.
 */
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "font-src 'self' https://fonts.gstatic.com",
  `connect-src 'self' https://api.cloudinary.com${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  /**
   * Security headers globales para todas las rutas.
   *
   * Aplica a `/(.*)`. Se mantiene un solo array — todos los headers son
   * universales (sin variantes per-ruta). Si en algún momento hay que
   * relajar CSP para una ruta específica (ej. embed admin con iframe),
   * agregar una segunda entry al array `headers()`.
   *
   * HSTS con `preload` requiere submission a hstspreload.org tras
   * verificar que el sitio funciona OK con HTTPS forzado por 2-3 meses.
   * No bloqueante en este PR — el header solo declara intent.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspDirectives,
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
