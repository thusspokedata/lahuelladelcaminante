# Umami analytics self-hosted en el VPS

## Contexto

Portal lahuelladelcaminante.de (Next.js 16, deploy manual vía rsync + PM2 en VPS
propio). Queremos analytics web sin Google Analytics ni terceros. Decisión tomada:
Umami self-hosted en el VPS de producción con Docker Compose (descartado: Umbrel
doméstico vía tunnel, DB de Umami en Neon, build from source con PM2).

Umami es cookieless y anonimiza visitantes → no requiere banner de consentimiento
GDPR. Aun así se recomienda mencionarlo en el Datenschutz (paso opcional al final).

Estado del VPS (verificado 2026-06-12):
- 4GB RAM (~2.3 disponibles), 7.3GB disco libre. Docker 29 instalado.
- nginx 1.24, un vhost por sitio; ya existe el patrón subdominio→cert→proxy
  (`vault.lahuelladelcaminante.de`).
- Puertos ocupados: 3001, 3002, 3004, 3006, 8000, 8888. **3005 libre → Umami.**
- DNS en clouding.io. El dev agrega a mano el registro A
  `umami → 187.33.155.194` (certbot lo necesita propagado).

Esta tarea tiene DOS FASES con flujos distintos. No las mezcles.

---

## FASE 1 — Infra en el VPS (por SSH, NO es parte del PR)

Ejecutás cada paso por SSH **anunciando antes qué vas a hacer y por qué**. Si algo
falla, parás y reportás; no improvises workarounds en el server de producción.

### 1.0 Precondición

Confirmá con el dev que el registro A `umami.lahuelladelcaminante.de →
187.33.155.194` ya está creado y propagado (`dig +short
umami.lahuelladelcaminante.de`). Sin esto, certbot falla. No sigas hasta tenerlo.

### 1.1 Docker Compose — `/opt/umami/docker-compose.yml`

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

- Generá `<DB_PASSWORD>` y `<APP_SECRET>` con `openssl rand -base64 32` en el
  momento. Viven SOLO en ese archivo en el VPS. NUNCA los pegues en el repo, en
  un commit, ni en el chat más allá de lo imprescindible.
- El Postgres del contenedor NO expone puerto al host.
- `docker compose up -d` y esperá a que ambos servicios estén healthy.

### 1.2 Cambiar la password de admin ANTES de exponer el panel

El stack arranca con credenciales default `admin`/`umami`. NO crees el vhost de
nginx todavía. Primero, desde el VPS, cambiá la password vía la API REST de Umami
contra `http://127.0.0.1:3005`:

1. `POST /api/auth/login` con `{"username":"admin","password":"umami"}` → token.
2. Generá una password nueva (`openssl rand -base64 24`).
3. Cambiala vía la API de update de usuario usando el token (verificá el endpoint
   exacto en la versión instalada; en Umami 2.x es un PATCH/POST sobre el usuario
   admin con `password`).
4. Verificá que el login con la password nueva funciona y que `admin`/`umami` ya
   NO funciona.
5. Entregale la password nueva al dev por el canal en que están trabajando y
   borrala de cualquier archivo temporal del VPS.

Si la API no lo permite en esta versión, frená y avisale al dev para que la cambie
él por UI vía tunnel SSH (`ssh -L 3005:127.0.0.1:3005`) ANTES de seguir con nginx.
El panel no debe quedar nunca accesible públicamente con credenciales default.

### 1.3 nginx + TLS

- Vhost `umami.lahuelladelcaminante.de` siguiendo el patrón de los vhosts
  existentes (mirá el de `vault.` como referencia): `proxy_pass
  http://127.0.0.1:3005`, headers de proxy estándar.
- `certbot --nginx -d umami.lahuelladelcaminante.de`.
- Redirect HTTP→HTTPS como en los demás vhosts.
- `nginx -t` antes de recargar. Verificá que los sitios existentes siguen
  respondiendo después del reload.

### 1.4 Crear el website en Umami

Con el dev logueado (o vos vía API con el token nuevo): crear el website
"La Huella del Caminante" con dominio `lahuelladelcaminante.de` y obtener el
**website ID**. Lo necesitás para la Fase 2.

### Verificación de Fase 1

- `https://umami.lahuelladelcaminante.de` sirve el panel con TLS válido.
- `curl http://187.33.155.194:3005` desde fuera NO responde (loopback only).
- `docker compose ps` en `/opt/umami`: ambos servicios healthy.
- `free -h`: RAM bajo control, PM2 y las otras apps no afectadas.
- Login default `admin`/`umami` rechazado.

---

## FASE 2 — Integración en el sitio (repo, branch `feat/umami-analytics`)

### 2.0 Verificar dónde corre el build (CRÍTICO antes de tocar nada)

`NEXT_PUBLIC_*` se inyecta en el bundle **en build time**, no en runtime. Leé
`deploy.sh` y determiná dónde corre `next build`:

- Si el build corre **en el VPS** → la var va en el `.env.local` del VPS.
- Si el build corre **local** y se rsyncea `.next/` → la var tiene que estar en el
  `.env.local` LOCAL del dev al momento de buildear; setearla en el VPS no sirve.

Reportale al dev cuál es el caso y dónde la vas a setear antes de seguir.

### 2.1 Script de Umami en el layout

En `src/app/[locale]/layout.tsx` (es el layout que renderiza `<html>`; el
`src/app/layout.tsx` raíz es passthrough):

```tsx
{process.env.NODE_ENV === "production" &&
process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? (
  <Script
    src="https://umami.lahuelladelcaminante.de/script.js"
    data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
    data-domains="lahuelladelcaminante.de"
    strategy="afterInteractive"
  />
) : null}
```

- **Doble gate + data-domains** (delta sobre el snippet original del spec):
  como el build de prod corre LOCAL (ver 2.0), la env var vive en el
  `.env.local` del dev — sin el check de `NODE_ENV === "production"`,
  `npm run dev` también trackearía. `data-domains` además restringe la
  emisión al dominio real (cinturón extra para previews/IP).
- `next/script` con `afterInteractive`: no bloquea el render.
- Import de `Script` desde `next/script`.

### 2.2 Env var

- Setear `NEXT_PUBLIC_UMAMI_WEBSITE_ID=<website ID de Fase 1>` donde el build la
  lea (según 2.0).
- Agregar la var (sin valor real, comentada o de ejemplo) a `.env.example` si el
  repo lo tiene.

## Criterios de aceptación

- [ ] `https://umami.lahuelladelcaminante.de` sirve el panel con TLS.
- [ ] Contenedor accesible solo por loopback (verificado desde fuera).
- [ ] Credenciales default deshabilitadas ANTES de que el panel sea público.
- [ ] Visitar lahuelladelcaminante.de en prod registra un pageview en Umami.
- [ ] En dev local NO se carga el script (sin env var).
- [ ] `docker compose ps` healthy; PM2 y demás apps sin impacto de RAM.
- [ ] Build pasa; el diff del PR contiene SOLO el cambio del layout (+
      `.env.example` si aplica).

## Fuera de alcance (YAGNI — no implementar)

- Eventos custom / goals (solo pageviews).
- Backup automatizado del Postgres de Umami.
- Exclusión del tracking en dashboard/admin.
- Otros sitios del VPS en este Umami.

## Flujo de entrega

1. Ejecutá la Fase 1 (infra) por SSH anunciando cada paso. NO es parte del PR.
2. Implementá la Fase 2 cumpliendo los criterios de aceptación, en branch
   `feat/umami-analytics` desde `main` actualizado.
3. Hacé todos los commits necesarios (atómicos, mensajes descriptivos). No abras
   PR con trabajo a medio terminar.
4. Antes de abrir el PR, corré el code review interno con los agentes
   `architecture-reviewer` y `api-contract-reviewer` sobre el diff, y resolvé lo
   que marquen.
5. Recién después abrí el PR contra `main` — lo va a revisar CodeRabbit, así que
   el mensaje del PR debe ser claro y el diff limpio.
6. NO hagas merge a `main` sin autorización explícita del dev.
7. Tras el merge autorizado: deploy según `deploy.sh`, con la env var presente
   donde el build la necesite (ver 2.0).

## Paso manual del dev (opcional, recomendado en DE)

Párrafo en el Datenschutz sobre analytics self-hosted, cookieless y sin datos
personales. Si querés, pedíselo al PM como tarea aparte.
