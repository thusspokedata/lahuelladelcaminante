-- Aplicar a la DB DESPUÉS de deployar el código de
-- `feat/public-signup-creator-flow`.
--
-- Local: psql "$DATABASE_URL" -f prisma/migrations-manual/2026-05-20_userprofile_status_pending_to_active.sql
-- Prod:  misma cosa apuntando a la URL de producción.
--
-- CONTEXTO
-- Antes de este PR, el hook `user.create.after` escribía
-- `UserProfile.status = PENDING` por default. El modelo nuevo separa
-- el estado de la CUENTA (siempre `ACTIVE`) del rol creator: el
-- "pending" de "todavía no sos creator" vive en `Application.status`,
-- no en `UserProfile.status`. Las cuentas que nacieron con el hook
-- viejo y quedaron en `PENDING` hay que normalizarlas a `ACTIVE` —
-- su status nunca debió bloquear nada.
--
-- ESTADO AL ESCRIBIR ESTE SCRIPT (inspección de producción del
-- 2026-05-20): **0 filas** en `UserProfile` con `status = 'PENDING'`.
-- Este UPDATE es **no-op hoy**. Se deja documentado como red de
-- seguridad por si una cuenta quedara en `PENDING` por un signup en
-- vuelo durante el deploy, o por cualquier edge-case futuro.
--
-- IMPORTANTE: el UPDATE solo toca `status`. NUNCA `role`. Una cuenta
-- con `role` creator/admin mantiene su rol intacto — solo se le
-- normaliza el status que el hook viejo dejó mal. NO incluir `role`
-- en el SET.
--
-- El `@default` de la columna (`PENDING` → `ACTIVE`) lo sincroniza
-- `prisma db push` durante el deploy (cambio no-destructivo); no hace
-- falta un ALTER COLUMN acá.
--
-- Idempotente: re-ejecutar el script no rompe nada (los UPDATEs
-- siguientes matchean 0 filas).

BEGIN;

UPDATE "UserProfile" SET "status" = 'ACTIVE' WHERE "status" = 'PENDING';

COMMIT;
