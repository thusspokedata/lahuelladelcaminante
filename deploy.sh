#!/bin/bash
set -e
cd /var/www/lahuelladelcaminante
git pull
npm ci --legacy-peer-deps
npx prisma generate
npm run build
pm2 restart lahuella
echo Deploy completo ✓
