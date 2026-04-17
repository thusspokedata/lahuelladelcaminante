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

echo "→ Installing Linux-specific native packages..."
ssh $VPS "cd $REMOTE_DIR && npm install @parcel/watcher-linux-x64-glibc --no-save 2>/dev/null || true"

echo "→ Regenerating Prisma client on VPS..."
ssh $VPS "cd $REMOTE_DIR && npx prisma generate"

echo "→ Restarting PM2..."
ssh $VPS "pm2 restart lahuella"

echo "✓ Deploy completo — https://lahuelladelcaminante.de"
