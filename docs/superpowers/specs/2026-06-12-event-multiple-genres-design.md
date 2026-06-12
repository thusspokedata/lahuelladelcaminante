# Eventos con múltiples géneros + creación de géneros nuevos

## Contexto

Portal de eventos de música latinoamericana (Next.js 16, React 19, TS, Tailwind 4,
Prisma 7 + PostgreSQL en **Neon**, Better Auth, next-intl). Roles: admin, creator, user.

Hoy un evento tiene un único género (`Event.genre String?`) elegido de una lista
hardcodeada con un `<select>` de opción única. Caso disparador real: un organizador
necesita cargar un evento cuyo género es "Fusión Multicultural: Latin Pop, Blues,
Reggae" — tres géneros, dos de ellos (Blues, Reggae) no están en la lista curada.

Decisión de producto ya tomada (no la re-evalúes): cualquier usuario con permiso de
cargar/editar eventos (creator o admin) puede crear géneros nuevos al vuelo. El
control de duplicados va por UX (filtrado normalizado de sugerencias), NO por
permisos ni por flujo de aprobación.

## Objetivo

1. Que un evento pueda tener **varios géneros** (`String[]`).
2. Que si un género no existe en la lista, se pueda **crear en el momento** desde el
   form, con un combobox multi-select creatable.
3. Que el filtrado de sugerencias sea **normalizado** (case + acentos) para empujar
   reutilización y minimizar duplicados semánticos.

## Decisión de diseño

Array de strings + combobox multi-select creatable. **No** se introduce tabla
catálogo (`Genre`) ni relación many-to-many: es overkill. El catálogo "crece solo"
porque las sugerencias se derivan de los géneros ya usados en eventos, unidos a una
lista curada base. Consistente con `Artist.genres` (ya es `String[]`), pero con mejor
UX vía el Combobox de Base UI (chips + sugerencias + crear).

## Modelo de datos

`Event.genre String?` → **`Event.genres String[] @default([])`**

En `prisma/schema.prisma`: reemplazar la línea `genre String?` por `genres String[]`.

### Migración (Neon, manual según runbook de deploy)

El script real vive en `prisma/migrations-manual/2026-06-12_event_genre_to_genres_array.sql`
(transaccional e idempotente, con guards `IF NOT EXISTS` y backfill condicional).
Resumen:

```sql
BEGIN;

ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "genres" TEXT[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Event' AND column_name = 'genre'
  ) THEN
    UPDATE "Event"
    SET "genres" = ARRAY["genre"]
    WHERE "genre" IS NOT NULL
      AND ("genres" IS NULL OR cardinality("genres") = 0);

    ALTER TABLE "Event" DROP COLUMN "genre";
  END IF;
END $$;

-- GIN para el filtro público `genres: { has }` (home / `/events`).
CREATE INDEX IF NOT EXISTS "Event_genres_idx" ON "Event" USING GIN ("genres");

COMMIT;
```

- Backfill ANTES de dropear: ningún evento existente pierde su género.
- La columna `genre` vieja se elimina (decisión confirmada: no se conserva).
- Orden seguro contra downtime: el ADD con default y el UPDATE son no-bloqueantes
  para el tamaño actual de la tabla; el DROP corre al final.
- `SceneEvent` (calendario) no tiene género: no se toca.
- `Artist.genres` ya es `String[]`: no se toca.

Recordatorio Prisma 7: las URLs se declaran en `prisma.config.ts`, no en
`schema.prisma`. Tras `npm ci`, correr `prisma generate` a mano (no hay postinstall).

## Form — `src/components/events/EventForm.tsx`

- Eliminar la const `GENRES` y el `<FormSelect>` de género único (incluida la opción
  `""`/`noGenre` y `Otros`/`genreOther`).
- Insertar un **Combobox multi-select creatable** (`@base-ui/react/combobox`, partes
  `Chips` / `Chip` / `ChipRemove` / `Input` / `Item` / `Empty`):
  - Chips para los géneros seleccionados, cada uno con botón de quitar.
  - Lista de sugerencias filtrada por lo que se escribe.
  - Opción "+ crear «X»" SOLO cuando el texto tipeado no matchea ninguna sugerencia
    tras normalizar (ver abajo).
- **Fuente de sugerencias** (prop `genreSuggestions: string[]` desde el server):
  unión de
  1. lista curada base (`BASE_GENRES`): Tango, Salsa, Cumbia, Reggaeton, Merengue,
     Son Cubano, Bossa Nova, Vallenato, Flamenco Latino, Latin Jazz, Folklore; y
  2. géneros ya usados en eventos existentes.

  `BASE_GENRES` vive como constante compartida (en services o un módulo de constantes).
- **Filtrado normalizado (el delta clave):** al comparar lo tipeado contra las
  sugerencias, normalizar AMBOS lados con lowercase + strip de acentos antes de
  matchear (substring sobre el valor normalizado). Esto hace que "regae" sugiera
  "Reggae" y "folclore" sugiera "Folklore", suprimiendo la opción "+ crear" cuando
  ya existe algo equivalente. Typo-tolerance completa (Levenshtein/fuzzy con
  distancia) es OPCIONAL y solo si NO requiere sumar dependencia nueva; si la
  requiere, no la implementes.
- **Validación / normalización al guardar** (antes de mandar al backend):
  - `trim` de cada valor, descartar vacíos.
  - Dedup case-insensitive (y acento-insensitive): "Reggae" y "reggae" cuentan como
    uno; se conserva la primera grafía ingresada.
  - Zod del form: `genre: z.string().optional()` → `genres: z.array(z.string())`.
- `defaultValues`: `genre ?? ""` → `genres ?? []`.

## Servicios — `src/services/events.ts`

- Tipos: `genre: string | null` → `genres: string[]` en `EventSummary` y en el tipo
  de detalle. Los mapeos (`genre: event.genre`) pasan a `genres: event.genres`.
- Create / update: escribir `genres` (array normalizado) en lugar de `genre`.
- Filtrado por género: `where: { genre: X }` → `where: { genres: { has: X } }`.
- `getActiveGenres()`: hoy hace `distinct` + `orderBy` sobre la columna escalar.
  Pasa a: traer `select: { genres: true }` de los eventos activos no borrados,
  aplanar, dedup (case/acento-insensitive) y ordenar alfabéticamente en JS. Dataset
  chico; no se necesita `unnest` en SQL.
- Nuevo helper `getGenreSuggestions(): Promise<string[]>` (o reusar `getActiveGenres`
  unido a `BASE_GENRES`) para alimentar el form en las páginas new/edit.

## API — Zod schemas

- `src/app/api/events/route.ts`: `genre: z.string().optional()` →
  `genres: z.array(z.string()).optional()`. El filtro GET por `genre` (query param)
  se mantiene como string único y se traduce a `{ genres: { has } }` en el servicio.
- `src/app/api/events/[id]/route.ts`: mismo cambio en el schema de update.

## Superficies de display (1 badge → N badges)

Renderizar varios chips/badges en vez de uno:

- Detalle público: `src/app/[locale]/(public)/events/[slug]/page.tsx`.
- Card de evento (lista pública) — donde se muestre el género.
- Lista dashboard: `src/app/[locale]/(protected)/dashboard/events/page.tsx`.
- Lista admin: `src/app/[locale]/(admin)/admin/events/page.tsx`.

Sin cambios funcionales (siguen operando sobre lista de strings), solo adaptar a array:

- Strip de géneros del home (`(public)/page.tsx`) — ya consume `getActiveGenres()`.
- `EventFilter` — ya opera sobre `string[]`; el filtrado pasa a `has` vía servicio.

## i18n — `messages/{es,en,de}.json`

- Quitar las keys obsoletas `eventForm.fields.noGenre` y `eventForm.fields.genreOther`.
- Agregar las del combobox en los tres locales:
  - placeholder del input (ej. "Agregá o elegí géneros…").
  - label de crear (ej. "Crear «{value}»").
  - empty state (sin coincidencias).

## Criterios de aceptación

- [ ] `Event.genres String[] @default([])` en schema; columna `genre` eliminada.
- [ ] Migración SQL hace backfill ANTES del DROP; ningún evento pierde su género.
- [ ] El form usa el Combobox multi-select creatable con chips removibles.
- [ ] Se pueden cargar varios géneros en un evento, incluyendo géneros nuevos.
- [ ] Al tipear "regae" se sugiere "Reggae" y NO aparece "+ crear «regae»"
      (filtrado normalizado case + acentos funcionando).
- [ ] La opción "+ crear «X»" solo aparece cuando no hay match normalizado.
- [ ] Al guardar: trim, descarte de vacíos, y dedup case/acento-insensitive.
- [ ] Géneros nuevos creados aparecen como sugerencia en el siguiente alta.
- [ ] Filtro público por un género lista los eventos que lo tienen (vía `has`).
- [ ] Todas las superficies de display muestran N badges en vez de uno.
- [ ] i18n: keys obsoletas removidas, nuevas keys en es/en/de.
- [ ] `prisma generate` + typecheck pasan. Build local con Node 22.13.1.

## Fuera de alcance (YAGNI — no implementar)

- Tabla catálogo `Genre` y UI de gestión de catálogo.
- Renombrado/merge masivo de géneros existentes.
- Traducción de los nombres de género (se guardan como strings tal cual).
- Restricción de creación por rol o flujo de aprobación de géneros.
- Cualquier analytics/instrumentación de uso de géneros.

## Verificación manual

- Crear un evento con varios géneros incluyendo uno nuevo (Blues/Reggae).
- Editar uno existente: su género migrado se ve como chip.
- Verificar que el género nuevo aparece como sugerencia en el siguiente alta.
- Verificar que tipear una variante (acentos/case) del género existente NO ofrece crear.
- Verificar que el filtro público por ese género lista el evento.

## Flujo de entrega

1. Implementá la tarea cumpliendo los criterios de aceptación. Branch
   `feat/event-multiple-genres` desde `main` actualizado.
2. Hacé todos los commits necesarios (atómicos, mensajes descriptivos). No abras PR
   con trabajo a medio terminar.
3. Antes de abrir el PR, corré el code review interno con los agentes
   `architecture-reviewer` y `api-contract-reviewer` sobre el diff, y resolvé lo que
   marquen.
4. Recién después abrí el PR contra `main` — lo va a revisar CodeRabbit, así que el
   mensaje del PR debe ser claro y el diff limpio.
5. NO hagas merge a `main` sin autorización explícita del dev.

## Nota de deploy (para el dev, ejecutar manualmente — CC no lo hace)

Este PR toca `prisma/schema.prisma`. Además de `deploy.sh`, aplicar la migración SQL
manual contra Neon + `prisma db push`. Correr `prisma generate` tras `npm ci`.
