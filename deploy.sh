#!/bin/bash
# Deploy de producción: working tree local (main) -> Pi `nextcloud`, build en la Pi.
#
# Topología:
#   lahuelladelcaminante.de -> vps2 (nginx, solo reverse proxy)
#     -> WireGuard 10.8.0.2:3007 -> Pi `nextcloud` (ssh alias `web` por defecto)
#     -> contenedor `lahuelladelcaminante` (compose en ~/lahuelladelcaminante)
#
# Dockerfile, docker-compose.yml, .dockerignore, app.env, db.env e infra/ viven
# SOLO en la Pi: este script no los sube ni los borra. El rsync va sin --delete
# (un archivo borrado en el repo queda en la Pi; borrarlo allá a mano).
# El build corre nativo en la Pi (arm64), así que no se sube node_modules ni .next.
#
# Uso:
#   bash deploy.sh             # deploy completo
#   bash deploy.sh --dry-run   # muestra qué subiría el rsync, sin tocar nada
#   PI_HOST=nextcloud bash deploy.sh   # si tu alias ssh de la Pi es otro
set -euo pipefail
cd "$(dirname "$0")"

PI="${PI_HOST:-web}"
REMOTE_DIR=lahuelladelcaminante
DRY=0
[ "${1:-}" = --dry-run ] && DRY=1
die(){ echo "✗ $*" >&2; exit 1; }

# --- 1. Solo se despliega main limpio y al día con origin ---
[ "$(git rev-parse --abbrev-ref HEAD)" = main ] || die "No estás en main."
[ -z "$(git status --porcelain)" ] || die "Hay cambios sin commitear."
git fetch -q origin main
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || die "main local no coincide con origin/main (git pull)."
SHA="$(git rev-parse HEAD)"
echo "→ Deploy de ${SHA:0:7} a $PI:~/$REMOTE_DIR"

# --- 2. Subir el código (sin --delete, sin los archivos propios de la Pi) ---
# --checksum + permisos fijos: solo viajan (y se listan) los cambios de contenido.
RSYNC_OPTS=(-rlz --checksum --chmod=D755,F644 --itemize-changes
  --exclude=.git --exclude=node_modules/ --exclude=.next/
  --exclude=app.env --exclude=db.env --exclude='.env*'
  --exclude=Dockerfile --exclude=docker-compose.yml --exclude=.dockerignore
  --exclude=infra/ --exclude=DEPLOYED_SHA --exclude='*.bak*'
  --exclude=.DS_Store --exclude=tsconfig.tsbuildinfo --exclude=next-env.d.ts
  --exclude=.claude/ --exclude=.superpowers/)
if [ "$DRY" = 1 ]; then
  echo "→ rsync --dry-run (archivos que cambiarían):"
  rsync -n "${RSYNC_OPTS[@]}" ./ "$PI:$REMOTE_DIR/" | grep -v '/$' || echo "  (ninguno)"
  exit 0
fi
echo "→ rsync..."
rsync "${RSYNC_OPTS[@]}" ./ "$PI:$REMOTE_DIR/" | grep -v '/$' || true

# --- 3. Build y recreate en la Pi, con rollback a la imagen previa ---
ssh "$PI" bash -s -- "$SHA" <<'REMOTE'
set -euo pipefail
SHA="$1"
cd ~/lahuelladelcaminante
PREV="pre-$(cut -c1-7 DEPLOYED_SHA 2>/dev/null || date +%Y%m%d-%H%M)"
docker tag lahuelladelcaminante:latest "lahuelladelcaminante:$PREV"
echo "→ imagen actual guardada como :$PREV"

rollback(){
  rc=$?
  [ $rc -eq 0 ] && return
  echo "✗ FALLO (rc=$rc): vuelvo a :$PREV" >&2
  docker tag "lahuelladelcaminante:$PREV" lahuelladelcaminante:latest
  docker compose up -d --no-deps --no-build web || true
  echo "  El código nuevo sigue en la Pi; el contenedor corre la imagen previa." >&2
}
trap rollback EXIT

echo "→ docker compose build web (en la Pi, ~15 min)..."
docker compose build web
docker compose up -d --no-deps web

echo "→ esperando healthy..."
for _ in $(seq 1 60); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' lahuelladelcaminante)" = healthy ] && break
  sleep 5
done
[ "$(docker inspect -f '{{.State.Health.Status}}' lahuelladelcaminante)" = healthy ]
for p in /es /de; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3007$p")"
  [ "$code" = 200 ] || { echo "✗ $p devolvió $code" >&2; exit 1; }
done

echo "$SHA" > DEPLOYED_SHA
echo "✓ Deploy OK: ${SHA:0:7} (healthy, /es y /de 200)."
echo "  Imagen previa: lahuelladelcaminante:$PREV (borrar con docker rmi cuando esté estable)."
REMOTE
