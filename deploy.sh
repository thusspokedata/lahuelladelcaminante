#!/bin/bash
# Deploy script — builds locally (VPS cannot reliably run npm install or next build)
# then syncs build output and node_modules to server via rsync.
set -e

VPS="root@187.33.155.194"
REMOTE_DIR="/var/www/lahuelladelcaminante"

echo "→ Building locally..."
npm run build

echo "→ Syncing code to VPS..."
ssh $VPS "cd $REMOTE_DIR && git pull"

echo "→ Syncing .next to VPS..."
rsync -az --delete .next/ $VPS:$REMOTE_DIR/.next/

echo "→ Syncing node_modules to VPS..."
rsync -az --delete node_modules/ $VPS:$REMOTE_DIR/node_modules/

echo "→ Installing Linux-specific native binaries..."
# El rsync de `node_modules/` desde Mac (arm64) pisa los binarios nativos
# Linux que necesita el runtime del VPS. Hay que re-instalarlos para que
# Next/SWC/Tailwind/lightningcss/etc puedan cargar sus addons compilados.
# `--no-save` evita modificar package.json/package-lock.json del VPS
# (en el pasado se agregaron sin esa flag y quedó drift git que abortó
# pulls — ver commit que introdujo este fix).
#
# Si en el futuro Next/Prisma/Tailwind suben de versión y agregan un
# binario Linux nuevo, agregarlo a esta lista. Síntoma típico de uno
# que falta: PM2 entra en restart loop apenas se hace `pm2 restart`, y
# `pm2 logs lahuella` muestra "Cannot find module ...-linux-x64-..."
# en el primer log line.
#
# `|| true` mantiene back-compat con el patrón previo: si un install
# falla (network down, versión renombrada), el deploy continúa. Deuda
# conocida — si pasa, el sitio se rompe en runtime y lo notamos por
# el health check siguiente.
ssh $VPS "cd $REMOTE_DIR && npm install --no-save \
  @next/swc-linux-x64-gnu \
  @parcel/watcher-linux-x64-glibc \
  @rolldown/binding-linux-x64-gnu \
  @swc/core-linux-x64-gnu \
  @tailwindcss/oxide-linux-x64-gnu \
  @unrs/resolver-binding-linux-x64-gnu \
  lightningcss-linux-x64-gnu \
  2>/dev/null || true"

echo "→ Applying pending migrations on VPS..."
# `migrate deploy` aplica las migrations pendientes en orden, sin prompts.
# Idempotente: si no hay nuevas, no hace nada. Imprescindible en este step
# del flow porque `prisma generate` (siguiente) NO toca el DB — solo
# regenera el client TS. Sin esto, código nuevo que referencia columnas
# de migrations no aplicadas vuelca 500 en runtime.
#
# DATABASE_URL: Prisma CLI por sí solo NO auto-loadea `.env.local` (solo
# `.env`). Este repo cierra ese gap en `prisma.config.ts` con un `loadEnv()`
# custom que lee `.env.local` antes de exponer `datasource.url`. Verificado
# empíricamente: `prisma migrate status` desde el VPS conecta a Neon prod.
ssh $VPS "cd $REMOTE_DIR && npx prisma migrate deploy"

echo "→ Regenerating Prisma client on VPS..."
ssh $VPS "cd $REMOTE_DIR && npx prisma generate"

echo "→ Restarting PM2..."
ssh $VPS "pm2 restart lahuella"

echo "✓ Deploy completo — https://lahuelladelcaminante.de"
