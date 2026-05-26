# Spec: Creator Profile (PR A) — perfil público del organizador/creador

**Date:** 2026-05-26
**Status:** Design approved, ready for implementation plan
**Origin:** Brainstorming session via Superpowers `brainstorming` skill, approved by the dev.
**Scope:** This is **sub-project A** del proyecto "perfil del organizador". Sub-project B (multi-organizador via tabla `EventOrganizer`) queda para un PR posterior — ver `BACKLOG` al pie.

## Problem

Cuando un creator publica un evento, no hay forma pública de identificar quién lo publicó. El `User` solo tiene `name + image` (administrados por Better Auth), `UserProfile` tiene `bio` pero sin editor en la UI, y la página del evento no surfacea al creador. El visitante que descubre un evento bueno no puede "seguir" al organizador, ver qué otros eventos publicó, ni contactarlo.

Adicionalmente, el `Event.organizer` (free-text) hoy hace doble función ambigua: a veces describe a la productora/colectivo, a veces al user que publicó. Se decidió mantener `Event.organizer` solo para la primera función (productora/colectivo); la segunda (quién publicó) pasa a ser explícita vía el perfil del creator.

## Decision

Agregar un **perfil rico al `User`** (distinto del modelo `Artist`, que existe para performers), con página pública en `/creators/[slug]` mostrando perfil + grilla de eventos publicados. La página de detalle del evento gana un byline sutil con link al perfil del creator que lo publicó.

Decisiones cerradas durante el brainstorming:

| Decisión | Resolución |
|---|---|
| Relación con `Artist` | Distintos. Si un creator también performa, mantiene su entry `Artist` separado. |
| Fields del perfil | Estándar: `name` (existing) + `image` (existing) + `bio` (existe en `UserProfile`, falta editor) + **nuevos: `slug`, `city`, `socialMedia` (JSON)**. |
| Galería de eventos | Sí — el perfil público muestra grilla de eventos publicados (upcoming separado de past). |
| Surfacing en event detail | Byline simple + link, bajo el título. |
| Visibilidad | Pública siempre para `role: creator | admin`. Sin opt-in/opt-out. |
| Relación con `Event.organizer` free-text | Se mantiene como campo separado (productora/colectivo); el byline es independiente. |
| URL pattern | `/creators/[slug]` (paralelo a `/artists/[slug]`). |
| Slug generation | Auto-generado de `name` vía `generateUniqueSlug` (helper existente). Editable después por el creator. |
| Editor location | Extender `/dashboard/profile` con secciones nuevas (no nueva ruta). |

## Data model

Extender `UserProfile`:
```prisma
model UserProfile {
  // existing
  id        String     @id @default(cuid())
  userId    String     @unique
  status    UserStatus @default(ACTIVE)
  bio       String?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  // NEW
  slug        String?  @unique
  city        String?
  socialMedia Json?
}
```

`socialMedia` JSON shape (TS interface, no enforzado a nivel DB):
```ts
type SocialMedia = {
  instagram?: string  // handle sin @
  website?: string    // URL completa con https://
  other?: { label: string; url: string }  // un extra opcional (catchall)
}
```

`User` y `Event` no cambian de schema en este PR.

### Migration

1. `prisma migrate dev` agregando los 3 campos + unique constraint en `slug`.
2. **Backfill script** (one-off, run manual post-deploy) — `scripts/backfill-creator-slugs.ts`:
   - Lee todos los users con `role IN ('creator', 'admin')` que tengan `userProfile.slug IS NULL`.
   - Para cada uno: computa slug via `generateUniqueSlug(user.name, "user")` y UPDATE `UserProfile.slug`.
   - Run en local contra Neon dev primero, después en prod.

Users con `role: user` (no creators todavía) NO se backfilea — su slug queda NULL hasta que sean promovidos a creator (lazy backfill al cambio de rol, ver "Cambios fuera de UI" abajo).

## Routes

| Ruta | Tipo | Acción |
|---|---|---|
| `/[locale]/(public)/creators/[slug]/page.tsx` | **NUEVA** server async | Página pública del creator. Header con foto + nombre + bio + ciudad + social. Debajo: grilla de eventos upcoming + sección de pasados. 404 si user no existe, está BLOCKED, o no es creator/admin. |
| `/[locale]/(public)/creators/[slug]/loading.tsx` | **NUEVA** | Loading skeleton. |
| `/[locale]/(public)/events/[slug]/page.tsx` | Modificar | Agregar byline `Publicado por [Link]` bajo el título. Loader incluye `createdBy { name, profile { slug } }`. |
| `/[locale]/(protected)/dashboard/profile/page.tsx` | Modificar | Loader incluye el `userProfile` completo (bio/city/socialMedia/slug actuales) para hidratar el form. |
| `/[locale]/(protected)/dashboard/profile/ProfileForm.tsx` | Modificar | Agregar secciones: avatar, bio, ciudad, social, slug. Las secciones existentes (name/email/password/delete) quedan al final. |
| `/api/users/me/profile/route.ts` | **NUEVA** PATCH | Endpoint para actualizar bio/city/socialMedia/slug. Auth via `requireActive`. Validación con Zod. Devuelve 409 si slug colisiona. |

## Services

Nuevo `src/services/creators.ts` (`server-only`, paralelo a `services/artists.ts`):

```ts
export interface CreatorDetail {
  id: string
  name: string
  slug: string
  bio: string | null
  city: string | null
  image: string | null
  socialMedia: { instagram?: string; website?: string; other?: { label: string; url: string } } | null
}

export async function getCreatorBySlug(slug: string): Promise<CreatorDetail | null>
export async function getUpcomingEventsByCreator(userId: string): Promise<EventSummary[]>
export async function getPastEventsByCreator(userId: string): Promise<EventSummary[]>
```

- `getCreatorBySlug`: filtra `status !== "BLOCKED"` y `user.role IN ("creator","admin")`. Cache `unstable_cache` key `["creator-by-slug"]` tag `["creators"]`, revalidate 300.
- `getUpcomingEventsByCreator`/`getPastEventsByCreator`: análogos a los helpers existentes `getUpcomingEventsByArtist`/etc. Reusar `startOfTodayBerlin()`, `sortByNextDate()`, `mapToSummary()`. Cache tag `["events","creators"]`.

Actualizar `src/services/events.ts`:
- `getEventBySlug`: extender include para traer `createdBy: { select: { name, profile: { select: { slug } } } }`. Necesario para el byline.

## Edit form — nuevas secciones (`ProfileForm.tsx`)

Orden propuesto en la página (de arriba a abajo):

1. **Avatar** — `<ImageUploader>` (componente Cloudinary existente). Single image cuadrada, ~256×256 ideal. Endpoint: `authClient.updateUser({ image })` (Better Auth API).
2. **URL pública** — readonly: muestra `/creators/[slug]` actual como link clickeable. Editable: input con el slug + botón "Cambiar URL pública" + warning text: "Cambiar la URL rompe los links viejos. Quien tenga guardado el link anterior va a recibir un 404."
3. **Bio** — `<textarea>` con `maxLength={500}`, contador de chars.
4. **Ciudad** — `<input>` libre. Sin autocomplete por ahora.
5. **Redes sociales** — 3 campos:
   - "Instagram" — input que acepta handle con o sin `@` (normalizar al guardar).
   - "Sitio web" — input URL.
   - "Otra red" — dos inputs: `label` (texto, ej "Spotify", "Bandcamp") + `url`.
6. *(existing)* Nombre, Email, Contraseña, Eliminar cuenta.

Save UX por sección (sigue el patrón actual del form): botón "Guardar" por sección, toast de feedback.

Endpoint nuevo `PATCH /api/users/me/profile` recibe body:
```ts
{
  bio?: string | null
  city?: string | null
  socialMedia?: SocialMedia | null
  slug?: string
}
```

## Byline en event detail

Bajo el título del evento, antes (o cerca) del DateTile:

```tsx
{event.createdBy.profile?.slug ? (
  <Link href={`/creators/${event.createdBy.profile.slug}`} className="text-fg-secondary hover:text-brand transition-colors">
    {t("publishedBy")} <span className="text-fg-primary">{event.createdBy.name}</span>
  </Link>
) : (
  <span className="text-fg-secondary">
    {t("publishedBy")} {event.createdBy.name}
  </span>
)}
```

Tono: sutil, secondary, no compite con título/fecha. El nombre del creator en primary; el "Publicado por" en secondary.

Fallback (sin slug): solo texto, sin link.

## Authorization

- `/creators/[slug]` es **público**, sin auth. El service ya filtra BLOCKED + role.
- `PATCH /api/users/me/profile` requiere `requireActive` (auth + status ACTIVE).
- Solo el dueño puede editar su propio perfil — el endpoint NO acepta `userId` como parámetro; toma `session.user.id`. Admins NO editan perfiles ajenos en este PR (queda como backlog si hace falta).

## Cambios fuera de UI

**Lazy slug backfill al cambio de rol** — cuando un user pasa de `role: user` a `role: creator` (vía aprobación de Application o promoción manual de admin), su `UserProfile.slug` debe generarse en ese momento si estaba NULL. Punto de change: el endpoint `/api/apply/[id]` (aprobación) y `/api/users/[id]/role` (promoción de admin). Llamar a `generateUniqueSlug` y UPDATE en la misma transacción del role change.

## i18n (nuevas keys, ES/EN/DE)

- `dashboard.profilePublic.{title, sectionAvatar, sectionBio, sectionCity, sectionSocial, sectionUrl, bioPlaceholder, bioCharsLeft, cityPlaceholder, instagramHandle, website, socialOtherLabel, socialOtherUrl, slugChangeWarning, save, slugCollision}`
- `creators.{notFound, upcomingEvents, pastEvents, noEvents, from, bio, location, social}`
- `events.detail.publishedBy`

## Edge cases

| Caso | Comportamiento |
|---|---|
| Creator con 0 eventos publicados | Página renderiza header del perfil + sección vacía "Todavía no publicó eventos." |
| Perfil sin bio/foto (creator que no llenó) | Página minimal: nombre + grilla de eventos + "Sin bio aún" placeholder. Sin avatar → iniciales (componente `getInitials` existente). |
| Slug collision al editar | API devuelve 409. Form muestra error "Esa URL ya está tomada, probá otra." |
| Slug change rompe URLs viejas | Warning explícito en el form. **No implementamos redirects 301** en este PR — agregado a backlog. |
| User BLOCKED | `/creators/[slug]` → 404. El service filtra. |
| User borrado (cascade) | `UserProfile.onDelete: Cascade` → profile borrado. `/creators/[slug]` → 404. **Pero `Event.createdById` tiene FK con default RESTRICT en Prisma — borrar un user con eventos asociados va a fallar.** Decisión cerrada en spec: **mantener RESTRICT por ahora** (eventos legacy de un creator borrado pierden sentido editorial; mejor bloquear borrado de creators con eventos). Si en el futuro queremos permitirlo, cambiar a `SetNull` + manejar byline con fallback "Eliminado". |
| Slug NULL (legacy user no backfilleado) | Byline en eventos cae al fallback (solo texto, sin link). `/creators/null` no debería ser alcanzable porque el router exige un string en `[slug]`. |

## Files touched (estimate)

~10-12 archivos, ~400-500 LOC.

- `prisma/schema.prisma` (+ migration generada)
- `scripts/backfill-creator-slugs.ts` (one-off)
- `src/services/creators.ts` (nuevo)
- `src/services/events.ts` (extender include en `getEventBySlug`)
- `src/app/[locale]/(public)/creators/[slug]/page.tsx` (nuevo)
- `src/app/[locale]/(public)/creators/[slug]/loading.tsx` (nuevo)
- `src/app/[locale]/(public)/events/[slug]/page.tsx` (byline)
- `src/app/[locale]/(protected)/dashboard/profile/page.tsx` (loader)
- `src/app/[locale]/(protected)/dashboard/profile/ProfileForm.tsx` (secciones)
- `src/app/api/users/me/profile/route.ts` (nuevo)
- `src/app/api/apply/[id]/route.ts` (lazy slug backfill on role change)
- `src/app/api/users/[id]/role/route.ts` (lazy slug backfill on role change)
- `src/messages/{es,en,de}.json` (keys nuevas)

## Manual testing checklist

1. Backfill script corre OK en local contra Neon dev. Todos los creators/admins existentes ganan slug.
2. Login como creator → /dashboard/profile → completar bio + city + social + cambiar slug → guardar cada sección → ver toast.
3. Visitar `/creators/<slug>` (público, sin auth) → ver perfil + grilla de eventos publicados.
4. Crear evento como creator → ver evento en su perfil público.
5. Visitar `/events/<event-slug>` → byline "Publicado por [Nombre]" linkea correctamente al perfil.
6. Cambiar slug en /dashboard/profile → el viejo URL da 404, el nuevo funciona.
7. Slug collision: intentar guardar slug ya tomado → ver error en el form.
8. User BLOCKED (admin lo bloquea) → `/creators/<slug>` → 404.
9. Apply flow: nuevo signup que aplica como creator → al aprobar, su UserProfile.slug se setea (lazy backfill).
10. Locale switch en `/creators/<slug>` → copy traducido en ES/EN/DE.

## Backlog (out of scope para PR A)

- **PR B**: Multi-organizador (tabla `EventOrganizer`, owner + co-orgs, form multi-input, byline extendido, authorization).
- **`SlugAlias` table**: redirects 301 para slugs viejos cuando un creator cambia su slug.
- **Admin edita perfiles ajenos**: hoy solo el dueño puede; admins podrían tener este permiso en el futuro.
- **Métricas en perfil**: count de eventos publicados, fechas, etc.
- **Verified badge**: admin marca creators verificados.
- **Followers / suscripción a creator**.
- **SEO metadata específico** del creator page: `generateMetadata` con OG image + descripción rica (parte del audit SEO global pendiente).
- **Avatar crop UI** (Cloudinary transformations on upload).
- **Auto-link de organizadores** texto suelto → user real (decisión cerrada en brainstorming: NO).
- **Cambiar `Event.createdById` a `SetNull` y manejar byline "Eliminado"** si en el futuro se quiere permitir borrar creators con eventos.
