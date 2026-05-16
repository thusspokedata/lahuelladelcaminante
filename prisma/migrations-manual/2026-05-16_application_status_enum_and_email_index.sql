-- Aplicar a la DB ANTES de `prisma db push` cuando se mergee este PR.
--
-- Local:
--   psql "$DATABASE_URL" -f prisma/migrations-manual/2026-05-16_application_status_enum_and_email_index.sql
-- Producción:
--   Misma cosa apuntando a la URL prod (con backup previo).
--
-- ¿Por qué un SQL manual y no `prisma migrate dev`?
-- El repo usa workflow `prisma db push` (sin migrations versionadas).
-- `db push` NO puede transformar datos al convertir String → enum: si lo
-- corremos directo va a pedir reset de la tabla o fallar al castear los
-- valores existentes. Este script hace la transformación explícita antes
-- de que `db push` vea el schema nuevo.
--
-- Después de aplicar este SQL, `prisma db push` debería reportar
-- "Already in sync" — confirma que el schema del repo y el estado de
-- la DB matchean.

-- Idempotente: las 4 operaciones detectan si ya se aplicaron y se
-- saltean. Re-ejecutar el script no debe romper nada (importante para
-- retries de deploy o aplicación accidental dos veces).

BEGIN;

-- 1) Crear el enum solo si no existe. `DO $$ ... $$` permite control
--    flow dentro de SQL; pg_type tiene la lista de tipos definidos.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ApplicationStatus'
  ) THEN
    CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END
$$;

-- 2) Normalizar valores existentes (lowercase → UPPER). Tres UPDATEs
--    explícitos en lugar de un solo `UPPER(status)`: si aparece un valor
--    inesperado (typo histórico, valor custom), queda como está y el
--    ALTER TYPE de abajo falla con error claro en lugar de silenciosamente
--    convertir basura en NULL.
--
--    Idempotencia: si la columna ya migró a enum, los `WHERE` matchean
--    cero filas (los valores son 'PENDING'/'APPROVED'/'REJECTED', no
--    'pending'/'approved'/'rejected') — los UPDATEs son no-op.
UPDATE "Application" SET "status" = 'PENDING'  WHERE "status" = 'pending';
UPDATE "Application" SET "status" = 'APPROVED' WHERE "status" = 'approved';
UPDATE "Application" SET "status" = 'REJECTED' WHERE "status" = 'rejected';

-- 3) Cambiar el tipo de columna solo si todavía es text (la primera
--    pasada del script). DROP DEFAULT primero porque el cast de varchar
--    a enum no se aplica a defaults; lo re-seteamos al final con el
--    valor del nuevo tipo.
DO $$
BEGIN
  IF (
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'Application' AND column_name = 'status'
  ) = 'text' THEN
    ALTER TABLE "Application"
      ALTER COLUMN "status" DROP DEFAULT,
      ALTER COLUMN "status" TYPE "ApplicationStatus"
        USING "status"::"ApplicationStatus",
      ALTER COLUMN "status" SET DEFAULT 'PENDING';
  END IF;
END
$$;

-- 4) Index para Application.email — consumido por:
--    - `user.create.after` hook (corre en cada signup).
--    - `/user-pending` page (corre en cada visita PENDING).
--    Ambos eran sequential scan antes de este index.
CREATE INDEX IF NOT EXISTS "Application_email_idx" ON "Application"("email");

COMMIT;
