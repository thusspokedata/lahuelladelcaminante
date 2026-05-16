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

### Bonus: FK `Application.userId` — prioridad BAJA

**Origen:** PR de auth (`feat/redesign-auth-screens`); fragmento
remanente del item Prisma resuelto en PR #23.

El matching User ↔ Application sigue siendo por email (el hook
`user.create.after` y el endpoint admin approve buscan por
`Application.email`). Si un user cambia email entre aplicar y crear
cuenta, el match se rompe silenciosamente.

- Agregar `userId String?` + `user User? @relation(...)` opcional al
  modelo Application.
- Popular el campo cuando el user crea cuenta con email matching.
- Mantener el matching por email como fallback (cuentas creadas antes
  de la migración no van a tener `userId`).
- Cambiar el hook y `/api/apply/[id]` para preferir `userId` cuando
  esté presente.

## Resueltos

### ~~Rate limit IP-based para `/api/contact` — prioridad MEDIA~~

**Resuelto en PR #23** (`chore: backend hardening`). Utility in-memory
en `src/lib/rate-limit.ts`, default 3 req/min por IP, aplicado a
`/api/contact`. Si el tráfico crece, swap a Upstash/Vercel KV
manteniendo la API `checkRateLimit`.

### ~~Prisma — index en `Application.email` + enum `ApplicationStatus` — prioridad MEDIA~~

**Resuelto en PR #23** (`chore: backend hardening`). Schema actualizado
con `enum ApplicationStatus { PENDING APPROVED REJECTED }` + `@@index([email])`.
Call sites migrados a UPPER. Migración SQL manual en
`prisma/migrations-manual/` (el repo usa `db push`, no `migrate dev`).

### ~~Security headers globales en `next.config.ts` — prioridad MEDIA~~

**Resuelto en PR #23** (`chore: backend hardening`). 6 headers globales
en `next.config.ts`: X-Frame-Options, X-Content-Type-Options,
Referrer-Policy, Permissions-Policy, HSTS y CSP. CSP va en modo
**report-only** por ahora — promover a enforcement en PR siguiente
después de observar violaciones reales en producción durante 1-2 semanas.
