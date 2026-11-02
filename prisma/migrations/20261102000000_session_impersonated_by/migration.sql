-- Better Auth 1.7: el plugin admin espera session.impersonatedBy y, desde
-- 1.7.3, la validación de schema rechaza los requests de auth si falta.
-- IF NOT EXISTS: no falla si la columna ya se agregó a mano en alguna base.
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "impersonatedBy" TEXT;
