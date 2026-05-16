# Migrations manuales

El proyecto usa `prisma db push` como workflow principal (sync directo del
schema sin migrations versionadas). Funciona bien para cambios incrementales
no destructivos.

Pero algunos cambios — sobre todo los que **transforman datos existentes** —
no pueden delegarse a `db push` porque:

- Cambios de tipo (ej. `String` → `enum`) requieren cast manual o pueden
  perder datos.
- Renames sin `db push` lo detectan como drop + create.
- Backfills (popular columna nueva con datos derivados).

Para esos casos, este directorio guarda scripts SQL versionados con el
nombre `YYYY-MM-DD_<descripcion>.sql`. Cada script:

1. Documenta en su header **cuándo** aplicarse (típicamente antes del
   próximo `db push`).
2. Es transaccional (`BEGIN` / `COMMIT`) para que un error revierta todo.
3. Es idempotente cuando es posible, o al menos detecta el estado para
   no romperse al re-correr.

## Flujo de aplicación

### Local (developer)

```bash
psql "$DATABASE_URL" -f prisma/migrations-manual/<filename>.sql
pnpm exec prisma db push    # verifica sync — debería decir "Already in sync"
pnpm exec prisma generate   # regenera el cliente
```

### Producción

Backup primero, después:

```bash
psql "$PRODUCTION_DATABASE_URL" -f prisma/migrations-manual/<filename>.sql
```

El dev se asegura de hacer `prisma db push` post-deploy si hace falta
sincronizar índices u otros cambios no-destructivos del mismo PR.

## Migración futura a migrations versionadas

Si en algún momento queremos migrar a `prisma migrate` formal, conviene:

1. Hacer baseline de la DB actual: `prisma migrate diff --from-empty
   --to-schema-datamodel=prisma/schema.prisma --script > baseline.sql`.
2. Crear `prisma/migrations/0_baseline/migration.sql` con ese SQL.
3. Marcar como aplicada en cada entorno: `prisma migrate resolve
   --applied 0_baseline`.
4. A partir de ahí, `prisma migrate dev` para cambios nuevos.

Hasta entonces, este directorio cubre el caso de cambios destructivos
sin imponer ese workflow al resto.
