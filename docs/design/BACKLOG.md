# Backlog — diseño y rediseño

Items deliberadamente fuera de alcance del último PR mergeado, anotados acá
para no perderlos. Cuando se decida atacarlos, se crea un PR aparte con su
propio prompt.

## Pendientes

### Pantalla de mantenimiento

**Origen:** PR 9 (estados especiales).

Cuando el sitio esté caído por deploy o tareas administrativas, mostrar una
pantalla específica en lugar de la 404 / error genéricos.

- Crear `src/app/[locale]/maintenance/page.tsx` con la pantalla.
- Configurar `middleware.ts` para redirigir todo el tráfico a esa ruta
  cuando una variable de entorno `MAINTENANCE_MODE=true` esté activa.
- i18n del copy en ES/EN/DE.
- Considerar bypass por IP (admin) para que el dev pueda seguir trabajando
  durante el mantenimiento.

### `global-not-found.js` (Next 15.4+ / 16 experimental)

**Origen:** PR 9 (estados especiales). La doc oficial de Next sugiere
`global-not-found.js` cuando hay dynamic segment al top (`[locale]/`),
que es exactamente este caso. Hoy usamos `[locale]/not-found.tsx` que
captura los 404 con locale válido. Migrar cuando salga estable.

### `EmptyStateWithSuggestions`

**Origen:** PR 6 mencionaba el componente como "implementado", pero no
quedó en el repo. PR 9 (que iba a reusarlo) detectó la ausencia.

Componente con visual rico de "no se encontraron resultados" + chips de
sugerencias (géneros próximos, ciudades activas, etc.). Pensado para los
listados `/events` y `/artists` cuando los filtros no devuelven nada.

- `src/components/ui/EmptyStateWithSuggestions.tsx`.
- API: `{ title, body, suggestions: Array<{ label, href }> }`.
- i18n para los strings.
- Consumir desde `/events` y `/artists` cuando el array filtrado quede en 0.

## Deudas de seguridad y privacidad

Originadas en PR 8.5 (`/contact`). El scope del PR fue UI + endpoint con
defensas acotadas; las defensas más profundas quedaron deliberadamente
fuera para no inflarlo.

### GDPR consent + Datenschutzerklärung — prioridad ALTA

**Origen:** PR 8.5 (`/contact`) y aplicable al sitio entero.

El form de `/contact` procesa datos personales (nombre, email, mensaje)
sin consentimiento explícito ni link a una política de privacidad. Hoy
operamos en gris legal contra GDPR/DSGVO al servir desde Alemania.

- Página `/datenschutz` (DE) + `/privacy` (EN) + `/privacidad` (ES) con
  copy legal: qué datos recolectamos, base legal (Art. 6(1)(a) — consent
  o Art. 6(1)(f) — interés legítimo según caso), retención, derechos
  ARCO (acceso/rectificación/cancelación/oposición), encargados de
  tratamiento (Resend, Cloudinary, Neon).
- Checkbox de consent obligatorio en `/contact` (no pre-tildado) con
  link a Datenschutzerklärung. Bloquear submit si no está marcado.
- Datenschutzerklärung-compliant: idioma alemán para usuarios DE, sin
  dark patterns en el cookie banner si llegamos a poner uno.
- Eventualmente: Impressum (obligatorio en DE por la TMG) con nombre y
  dirección del responsable. Hoy no existe.

Bloquea poder operar legítimamente en mercado DE a mediano plazo.

### Rate limit IP-based para `/api/contact` — prioridad MEDIA

**Origen:** PR 8.5 (`/contact`).

El endpoint hoy se defiende con honeypot + Origin/Referer check, pero no
hay límite por IP. Un atacante con backend propio (sin browser) que
bypassee Origin/Referer puede hacer flood al endpoint y agotar quota de
Resend (afecta uptime del email de aprobaciones/welcome, no solo el
form de contacto).

- Implementar middleware o helper que use `headers().get("x-forwarded-for")`
  (cuidado con spoofing — confiar solo en el header agregado por nginx,
  no en el del cliente).
- Storage del contador: edge-compatible KV (Upstash/Vercel KV) o tabla
  Postgres con TTL si no agregamos infra. Postgres es más barato pero
  agrega latencia al endpoint.
- Política sugerida: 5 requests por IP por hora. Después devolver 429
  con `Retry-After`.
- Mismo helper se puede reusar en `/api/applications/submit` y futuros
  endpoints públicos.

### Security headers globales en `next.config.ts` — prioridad MEDIA

**Origen:** PR 8.5 (`/contact`) y aplicable al sitio entero.

Hoy las respuestas no llevan headers de seguridad (CSP, HSTS, X-Frame,
referrer-policy, permissions-policy). Vulnerable a clickjacking,
mixed-content downgrade, leaks de referrer cross-origin.

- Configurar `async headers()` en `next.config.ts` con:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Content-Security-Policy` ajustado a Cloudinary + Google fonts +
    Better Auth callbacks (auditar primero qué necesita cada origin —
    una CSP rota tira el sitio).
  - `X-Frame-Options: DENY` (o `frame-ancestors 'none'` vía CSP).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` por
    default.
- Verificar contra securityheaders.com — objetivo: nota A o superior.
- Considerar `report-uri` para violaciones de CSP en producción (al
  menos durante el primer mes después del deploy, para detectar falsos
  positivos antes de pasar de `Content-Security-Policy-Report-Only` a
  enforcement).
