# Eventos con múltiples géneros + géneros nuevos

**Fecha:** 2026-06-12
**Branch sugerida:** `feat/event-multiple-genres` (desde `main` actualizado)

## Problema

Hoy un evento tiene un único género (`Event.genre String?`) elegido de una lista
hardcodeada con un `<select>` de opción única. Necesitamos:

1. Que un evento pueda tener **varios géneros**.
2. Que si un género **no existe** en la lista, se pueda **agregar** en el momento.

Caso disparador: un organizador pidió cargar un evento cuyo género es
"Fusión Multicultural: Latin Pop, Blues, Reggae" — tres géneros, dos de ellos
(Blues, Reggae) no están en la lista curada actual.

## Decisión de diseño

**Array de strings + combobox multi-select creatable.** No se introduce una tabla
catálogo (`Genre`) ni relación many-to-many: sería overkill. El catálogo "crece
solo" porque las sugerencias se derivan de los géneros ya usados en eventos.

Esto es consistente con `Artist.genres` (que ya es `String[]`), pero mejora la UX
respecto al input de texto-por-comas de Artists usando el Combobox nativo de
Base UI (chips + sugerencias + crear).

## Modelo de datos

`Event.genre String?` → **`Event.genres String[] @default([])`**

`prisma/schema.prisma`: reemplazar la línea `genre String?` por `genres String[]`.

### Migración (Neon, manual según runbook de deploy)

```sql
ALTER TABLE "Event" ADD COLUMN "genres" TEXT[] NOT NULL DEFAULT '{}';
UPDATE "Event" SET "genres" = ARRAY["genre"] WHERE "genre" IS NOT NULL;
ALTER TABLE "Event" DROP COLUMN "genre";
```

- Backfill antes de dropear: ningún evento existente pierde su género.
- La columna `genre` vieja **se elimina** (decisión confirmada: no se conserva).
- Orden seguro contra downtime: el ADD con default y el UPDATE son no-bloqueantes
  en la práctica para el tamaño actual de la tabla; el DROP corre al final.
- `SceneEvent` (calendario) no tiene género: no se toca.
- `Artist.genres` ya es `String[]`: no se toca.

Recordatorio del proyecto: Prisma 7 declara las URLs en `prisma.config.ts`, no en
`schema.prisma`. Tras `npm ci` correr `prisma generate` a mano (no hay postinstall).

## Form — `src/components/events/EventForm.tsx`

- Eliminar la const `GENRES` y el `<FormSelect>` de género único (incluida la
  opción `""`/`noGenre` y `Otros`/`genreOther`).
- Insertar un **Combobox multi-select creatable** (`@base-ui/react/combobox`,
  partes `Chips` / `Chip` / `ChipRemove` / `Input` / `Item` / `Empty`):
  - Chips para los géneros seleccionados, cada uno con su botón de quitar.
  - Lista de sugerencias filtrada por lo que se escribe.
  - Opción "+ crear «X»" cuando el texto tipeado no coincide con ninguna sugerencia.
- **Fuente de sugerencias:** unión de
  1. lista curada base (la actual: Tango, Salsa, Cumbia, Reggaeton, Merengue,
     Son Cubano, Bossa Nova, Vallenato, Flamenco Latino, Latin Jazz, Folklore), y
  2. géneros ya usados en eventos existentes.

  Se pasa al form como prop `genreSuggestions: string[]` desde el server (páginas
  new/edit), calculada con un helper de servicios. La lista curada base vive como
  constante compartida (p. ej. `BASE_GENRES` en services o en un módulo de constantes).
- **Validación / normalización al guardar** (antes de mandar al backend):
  - `trim` de cada valor, descartar vacíos.
  - **Dedup case-insensitive**: Reggae y reggae cuentan como uno; se conserva la
    primera grafía ingresada.
  - Zod del form: `genre: z.string().optional()` → `genres: z.array(z.string())`.
- `defaultValues`: `genre ?? ""` → `genres ?? []`.

## Servicios — `src/services/events.ts`

- Tipos: `genre: string | null` → `genres: string[]` en `EventSummary` y en el tipo
  de detalle. Los mapeos (`genre: event.genre`) pasan a `genres: event.genres`.
- **Create / update**: escribir `genres` (array normalizado) en lugar de `genre`.
- **Filtrado por género**: `where: { genre: X }` → `where: { genres: { has: X } }`.
- **`getActiveGenres()`**: hoy hace `distinct` + `orderBy` sobre la columna escalar.
  Pasa a: traer `select: { genres: true }` de los eventos activos no borrados,
  aplanar, dedup (case-insensitive) y ordenar alfabéticamente en JS. El dataset es
  chico; no se necesita `unnest` en SQL.
- **Nuevo helper** `getGenreSuggestions(): Promise<string[]>` (o reusar
  `getActiveGenres` unido a `BASE_GENRES`) para alimentar el form.

## API — Zod schemas

- `src/app/api/events/route.ts`: `genre: z.string().optional()` →
  `genres: z.array(z.string()).optional()`. El filtro GET por `genre` (query param)
  se mantiene como string único y se traduce a `{ genres: { has } }` en el servicio.
- `src/app/api/events/[id]/route.ts`: mismo cambio en el schema de update.

## Superficies de display (1 badge → N badges)

Renderizar varios chips/badges en vez de uno:

- Detalle público: `src/app/[locale]/(public)/events/[slug]/page.tsx` (badge de género).
- Card de evento (lista pública) — donde se muestre el género.
- Lista dashboard: `src/app/[locale]/(protected)/dashboard/events/page.tsx`.
- Lista admin: `src/app/[locale]/(admin)/admin/events/page.tsx`.

Sin cambios funcionales (siguen operando sobre lista de strings), sólo se adaptan
a array:

- Strip de géneros del home (`(public)/page.tsx`) — ya consume `getActiveGenres()`.
- `EventFilter` — ya opera sobre `string[]`; el filtrado pasa a `has` vía servicio.

## i18n — `messages/{es,en,de}.json`

- Quitar las keys obsoletas `eventForm.fields.noGenre` y `eventForm.fields.genreOther`.
- Agregar las del combobox en los tres locales:
  - placeholder del input (p. ej. "Agregá o elegí géneros…").
  - label de crear (p. ej. "Crear «{value}»").
  - empty state (sin coincidencias).

## Testing / verificación

- `prisma generate` + typecheck pasan tras el cambio de tipos.
- Build local con Node 22.13.1.
- Manual: crear un evento con varios géneros incluyendo uno nuevo (Blues/Reggae),
  editar uno existente (se ve su género migrado como chip), verificar que el género
  nuevo aparece como sugerencia en el siguiente alta, y que el filtro público por
  ese género lista el evento.

## Fuera de alcance (YAGNI)

- Tabla catálogo `Genre` y UI de gestión de catálogo.
- Renombrado/merge masivo de géneros existentes.
- Traducción de los nombres de género (se guardan como strings tal cual).

## Flujo de entrega

1. Branch desde `main` actualizado, commits atómicos.
2. PR contra `main`, esperar CodeRabbit antes de proponer merge.
3. Correr architecture-reviewer / api-contract-reviewer sobre el diff antes del PR.
4. Como el PR toca `prisma/schema.prisma`: además de `deploy.sh`, aplicar la
   migración SQL manual + `prisma db push` contra Neon.
