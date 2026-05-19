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

## Operacional / observabilidad

### Verificar entrega del email "Nueva solicitud" al admin — prioridad ALTA (sanity check)

**Origen:** primer deploy a producción de PR #23 (2026-05-19).

Cuando alguien crea una `Application` via `/apply`, el endpoint dispara
`triggerApplicationNotification(...)` que manda un email a
`info@lahuelladelcaminante.de` (hardcoded en `src/lib/trigger.ts:254`).
Sin esa notificación, el admin no se entera de que hay applications
pendientes — y "ni se fija en el admin panel". El flow está implementado
pero al testear post-deploy el dev (admin) no recibió el email, y
quedó pendiente verificar si:

- El email salió de Resend (chequear dashboard Resend para ver delivery
  log).
- Llegó pero quedó en spam (primera vez que un dominio nuevo manda).
- El hardcode `info@lahuelladelcaminante.de` es la inbox correcta o
  conviene parametrizar via `CONTACT_RECIPIENT_EMAIL` (var ya existente
  con default a `info@...`).

Si todo OK, queda como sanity check resuelto. Si falla algo, fix:
- Refactor `triggerApplicationNotification` para leer
  `env.CONTACT_RECIPIENT_EMAIL` en lugar del hardcode.
- O agregar var nueva `ADMIN_NOTIFICATION_EMAIL` (dedicada vs reusar la
  de `/contact`). Decisión del dev.

## Producto y flow de cuenta

### Separar signup público del flujo creator — prioridad ALTA (UX)

**Origen:** validación del deploy de PR #23 (2026-05-19).

Hoy: cualquier signup nace `PENDING` y requiere aprobación admin
**antes** de poder hacer nada (incluso publicar). Es overkill —
significa que un usuario que solo quiere navegar el sitio igual tiene
que esperar a un humano.

Propuesto:
- **Signup público es inmediato**: cualquier persona se registra y la
  cuenta nace `ACTIVE` con `role: user`. Acceso normal al sitio.
- **Solo quien quiere publicar eventos** aplica como creator
  (`/apply`) — eso sí requiere review admin antes de que el `role`
  suba a `creator`.

Cambios necesarios (no triviales):
- `databaseHooks.user.create.after` en `src/lib/auth.ts`: cambiar
  default de `PENDING` a `ACTIVE`. Mantener la excepción "si hay
  Application APPROVED previa, también activar role creator".
- `requireActive` y los redirects ya no aplican como hoy — un user
  ACTIVE sin role creator que entra a `/dashboard` debería ver una
  pantalla "tu cuenta no es creator, aplicá acá" (nueva), no
  `/user-pending`.
- `/user-pending` se reusa solo para el caso `applied as creator y
  todavía no aprobado` (vs hoy que dispara para cualquier signup).
- Copy de las pantallas de auth (sign-in/sign-up) revisar — hoy hablan
  del flujo "te revisamos 1-2 días" como si fuera universal.

Impacto en flujo de hoy: las 4 applications existentes con status
APPROVED siguen funcionando igual. Las cuentas existentes con
`UserProfile.status = PENDING` (creadas por hook viejo) habría que
decidir si bumpear masivamente a ACTIVE o dejarlas.

### Directorio público de creators (`/creators`) — prioridad MEDIA

**Origen:** validación del deploy de PR #23 (2026-05-19).

Hoy no hay forma pública de descubrir quién organiza eventos. Caso de
uso concreto: un artista latinoamericano que viene a Berlín quiere
contactar a un creator local para tocar — no tiene cómo encontrarlo.

- Página `/creators` (también `/promotores` o el nombre que decida el
  dev) listando todos los users con `role: creator` activos.
- Cada item: nombre del creator + ciudad principal + eventos publicados
  recientes + medio de contacto (Instagram / email / contact form
  específico).
- Eventualmente: filtros por ciudad (Berlín / Múnich / Hamburgo) y por
  género de eventos que organiza.

Modelo: necesita una entidad `CreatorProfile` con campos como `bio`,
`city`, `socialMedia`, `contactEmail`, etc. Hoy el creator solo tiene
el `User` + `UserProfile.status`. Hay que agregar el modelo y un form
en el dashboard para que el creator complete su perfil.

### Eventos favoritos (guardar/desguardar) — prioridad MEDIA

**Origen:** feedback del dev (2026-05-20).

El user logueado debería poder marcar un evento como favorito y volver
a encontrarlo más tarde sin tener que rebuscar en la agenda. Caso de
uso: encontrás un show interesante navegando pero no podés decidir hoy
si vas, lo guardás y lo revisitás antes de la fecha.

UX mínimo:
- Botón ♡ (corazón / bookmark / "Guardar", elegir lenguaje) en cada
  `EventCard` (listados, home, /events) y en `/events/[slug]`. Toggle
  on/off según estado actual.
- Si no está logueado, click redirige a `/sign-in?next=/events/<slug>`.
- Página `/dashboard/saved` (o `/favoritos` público según rol) listando
  los eventos guardados, ordenados por próxima fecha.
- Counter opcional en el header del dashboard ("3 guardados").

Modelo:
```prisma
model Favorite {
  id        String   @id @default(cuid())
  userId    String
  eventId   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  @@unique([userId, eventId])
  @@index([userId])
}
```

Endpoints:
- `POST /api/favorites/:eventId` — toggle (crea si no existe, borra si
  existe). Idempotente.
- `GET /api/favorites` — lista del user actual (consumido por
  `/dashboard/saved`).

Consideración: el flow PENDING actual (mientras el item de "separar
signup público" no esté implementado) bloquea esto si el user no puede
acceder al panel. Por eso: el botón ♡ debería funcionar para CUALQUIER
user logueado, independiente de su `UserProfile.status`. Es feature de
público (rol `user`), no de creator.

### Naming: "artista" vs "creator" en dashboard de onboarding — prioridad BAJA (cosmético)

**Origen:** validación del deploy de PR #23 (2026-05-19).

El dashboard onboarding (`/dashboard` post-aprobación) muestra los 3
pasos:

1. "Crear tu perfil de artista" ← **wrong**, debería ser "perfil de
   creator" (o "perfil de organizador" / "perfil de promotor", según
   la copy que prefiera el dev).
2. "Publicá tu primer evento" ← OK.
3. "Compartí tu link" ← OK.

El **artista es una entidad separada** (lo que vive en `/artists` y
gestiona el creator desde su panel). El **creator de eventos** es la
persona que se registra, aplica y publica — y ese es el perfil que el
paso 01 debería referir.

Cambio: editar copy del paso 01 del onboarding (y cualquier lugar del
dashboard que confunda los dos términos).

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
