# Umami analytics self-hosted en el VPS

**Fecha:** 2026-06-12
**Branch:** `feat/umami-analytics`

## Contexto

Queremos analytics web para lahuelladelcaminante.de sin Google Analytics ni
terceros. El dev tiene Umami en su Umbrel, pero un Umbrel doméstico no es
alcanzable desde los navegadores de los visitantes. Decisión tomada: hostear
Umami en el VPS de producción (descartado exponer el Umbrel vía tunnel, y
descartado depender de la conexión de casa).

Umami es cookieless y anonimiza visitantes → no requiere banner de
consentimiento GDPR (aun así, conviene mencionarlo en el Datenschutz).

## Estado del VPS (verificado 2026-06-12)

- 4GB RAM (~2.3 disponibles), 7.3GB disco libre — sobra para Umami (~300MB).
- Docker 29 instalado.
- nginx 1.24 con un vhost por sitio; ya existe el patrón subdominio→cert→proxy
  (`vault.lahuelladelcaminante.de`).
- Node 22 (no relevante: Umami va en contenedor).
- Puertos ocupados: 3001, 3002 (lahuella), 3004, 3006, 8000, 8888. **3005 libre
  → lo usa Umami.**
- DNS en clouding.io. Falta el registro A `umami → 187.33.155.194` (lo agrega
  el dev a mano; certbot lo necesita propagado).

## Decisión de hosting

**Docker Compose oficial** (opción A del brainstorm): contenedor
`ghcr.io/umami-software/umami:postgresql-latest` + `postgres:15-alpine` con
volumen propio. Descartado: DB en Neon (acopla analytics a la cuota del
negocio, latencia por evento) y PM2-from-source (el VPS no buildea bien,
mantenimiento doloroso).

## Diseño

### 1. Infra en el VPS — `/opt/umami/docker-compose.yml`

```yaml
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    ports:
      - "127.0.0.1:3005:3000"   # solo loopback; nginx hace el proxy
    environment:
      DATABASE_URL: postgresql://umami:<DB_PASSWORD>@db:5432/umami
      DATABASE_TYPE: postgresql
      APP_SECRET: <APP_SECRET>
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: <DB_PASSWORD>
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umami"]
      interval: 5s
      retries: 5
    restart: unless-stopped
volumes:
  umami-db-data:
```

- `<DB_PASSWORD>` y `<APP_SECRET>` se generan con `openssl rand -base64 32` al
  momento del setup y viven SOLO en ese archivo en el VPS (no en el repo).
- El Postgres del contenedor no expone puerto al host.

### 2. nginx + TLS

Vhost `umami.lahuelladelcaminante.de` (mismo patrón que los sites existentes):
`proxy_pass http://127.0.0.1:3005`, headers de proxy estándar. Cert con
`certbot --nginx -d umami.lahuelladelcaminante.de` (requiere el A record
propagado). HTTP→HTTPS redirect como en los demás vhosts.

### 3. Integración en el sitio (el único cambio en el repo)

En `src/app/[locale]/layout.tsx` (es el layout que renderiza `<html>`; el
`src/app/layout.tsx` raíz es passthrough):

```tsx
{process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? (
  <Script
    src="https://umami.lahuelladelcaminante.de/script.js"
    data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
    strategy="afterInteractive"
  />
) : null}
```

- Gated por `NEXT_PUBLIC_UMAMI_WEBSITE_ID`: sin la env var no se renderiza →
  dev local y builds sin analytics no ensucian datos. La var se setea en el
  `.env.local` del VPS (prod) después de crear el website en Umami.
- `next/script` con `afterInteractive`: no bloquea el render.
- Sin cookies → no toca el banner/consent (no hay) ni requiere opt-in.

### 4. Pasos manuales del dev

1. **Antes del certbot:** agregar registro A en clouding.io:
   `umami → 187.33.155.194`.
2. **Tras el deploy de infra:** login en `https://umami.lahuelladelcaminante.de`
   con `admin` / `umami` y **cambiar la password inmediatamente**.
3. Crear el website "La Huella del Caminante" en el panel de Umami → copiar el
   **website ID**.
4. Pasarle el website ID a CC para setear `NEXT_PUBLIC_UMAMI_WEBSITE_ID` en el
   `.env.local` del VPS y deployar el sitio.
5. Opcional (recomendado en DE): párrafo en Datenschutz sobre analytics
   self-hosted sin cookies ni datos personales.

### 5. Operación

- Logs: `docker compose -C /opt/umami logs` (o `docker compose -f ... logs`).
- Update: `docker compose pull && docker compose up -d` en `/opt/umami`.
- Los datos viven en el volumen `umami-db-data`; un `docker compose down` sin
  `-v` no los borra.
- Backup: fuera de alcance de este spec (el volumen queda en el VPS; si se
  quiere backup, `pg_dump` del contenedor a cron — decisión futura).

## Criterios de aceptación

- [ ] `https://umami.lahuelladelcaminante.de` sirve el panel de Umami con TLS.
- [ ] El contenedor escucha solo en loopback (no accesible por IP:3005 desde
      fuera).
- [ ] Visitar lahuelladelcaminante.de en prod registra un pageview en Umami.
- [ ] En dev local NO se carga el script (sin env var).
- [ ] `docker compose ps` muestra ambos servicios healthy/running y PM2/las
      otras apps no se ven afectadas (RAM bajo control).
- [ ] Password de admin cambiada (manual dev).

## Fuera de alcance (YAGNI)

- Eventos custom / goals (solo pageviews por ahora).
- Backup automatizado del Postgres de Umami.
- Tracking del dashboard/admin con segmentación (el script carga en todas las
  páginas; si molesta el ruido, excluir es decisión futura).
- Cualquier otro sitio del VPS en este Umami (multi-site es trivial después).

## Flujo de entrega

- Infra del VPS: la ejecuta CC por SSH **anunciando cada paso** (compose up,
  nginx, certbot). No es parte del PR.
- Cambio en el repo (script en layout): branch `feat/umami-analytics` → PR →
  CodeRabbit → merge con OK del dev → `deploy.sh`.
