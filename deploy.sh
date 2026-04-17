#!/bin/bash
# Deploy script — builds locally (VPS lacks RAM for Next.js build) then syncs to server
set -e

VPS="root@187.33.155.194"
REMOTE_DIR="/var/www/lahuelladelcaminante"

echo "→ Pulling latest code on VPS..."
ssh $VPS "cd $REMOTE_DIR && git pull"

echo "→ Building locally..."
npm run build

echo "→ Syncing .next to VPS..."
rsync -az --delete .next/ $VPS:$REMOTE_DIR/.next/

echo "→ Restarting PM2..."
ssh $VPS "pm2 restart lahuella"

echo "✓ Deploy completo — https://lahuelladelcaminante.de"
