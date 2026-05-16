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

BEGIN;

-- 1) Crear el enum.
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 2) Normalizar valores existentes (lowercase → UPPER). Tres UPDATEs
--    explícitos en lugar de un solo `UPPER(status)`: si aparece un valor
--    inesperado en la tabla (typo histórico, valor custom), queda como
--    está y el ALTER TYPE de abajo falla con error claro en lugar de
--    silenciosamente convertir basura en NULL.
UPDATE "Application" SET "status" = 'PENDING'  WHERE "status" = 'pending';
UPDATE "Application" SET "status" = 'APPROVED' WHERE "status" = 'approved';
UPDATE "Application" SET "status" = 'REJECTED' WHERE "status" = 'rejected';

-- 3) Cambiar el tipo de columna. DROP DEFAULT primero porque el cast
--    de varchar a enum no se aplica a defaults; lo re-seteamos al final
--    con el valor del nuevo tipo.
ALTER TABLE "Application"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ApplicationStatus"
    USING "status"::"ApplicationStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- 4) Index para Application.email — consumido por:
--    - `user.create.after` hook (corre en cada signup).
--    - `/user-pending` page (corre en cada visita PENDING).
--    Ambos eran sequential scan antes de este index.
CREATE INDEX "Application_email_idx" ON "Application"("email");

COMMIT;
