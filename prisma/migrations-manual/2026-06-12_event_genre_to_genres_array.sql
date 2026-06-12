-- Aplicar a la DB ANTES del `prisma db push` del deploy de
-- `feat/event-multiple-genres`.
--
-- Local: psql "$DATABASE_URL" -f prisma/migrations-manual/2026-06-12_event_genre_to_genres_array.sql
-- Prod:  backup primero, después misma cosa apuntando a la URL de producción.
--
-- CONTEXTO
-- Hasta este PR un evento tenía UN solo género (`Event.genre TEXT NULL`).
-- Ahora puede tener varios: la columna pasa a `Event.genres TEXT[]`. Este
-- cambio TRANSFORMA datos (backfill del valor único al array) y DROPEA la
-- columna vieja, así que no se puede delegar a `db push` — va por acá.
--
-- ORDEN (seguro contra pérdida de datos):
--   1. ADD `genres` con default `'{}'` (no-bloqueante para esta tabla).
--   2. Backfill: cada evento con `genre` no nulo arranca con `[genre]`.
--   3. DROP de la columna `genre` vieja (al final, ya backfilleada).
--
-- Tras correr esto, `prisma db push` debería reportar "Already in sync"
-- (el schema ya declara `genres String[]` y ya no tiene `genre`).
--
-- Idempotente: ADD IF NOT EXISTS es no-op si ya existe; el bloque de
-- backfill+drop solo corre mientras la columna `genre` siga presente, así
-- que re-ejecutar el script no rompe nada.

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

COMMIT;
