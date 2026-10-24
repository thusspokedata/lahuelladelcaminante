# La Huella del Caminante

Portal de eventos de música latinoamericana en vivo en Berlín. Conecta artistas y público con la escena latina.

**Live:** [https://lahuelladelcaminante.de](https://lahuelladelcaminante.de)

---

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Base de datos:** PostgreSQL + Prisma 7 (adapter `@prisma/adapter-pg`)
- **Auth:** Better Auth (email/password + Google OAuth)
- **Imágenes:** Cloudinary
- **UI:** Tailwind CSS v4 + shadcn/ui
- **i18n:** next-intl (`/es`, `/en`)
- **Deploy:** VPS Ubuntu + PM2 + nginx + Let's Encrypt

---

## Desarrollo local

```bash
npm install
npm run dev
```

Requiere un archivo `.env.local` con las siguientes variables:

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_URL=
CLOUD_NAME=
UPLOAD_PRESET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_CLOUDINARY_URL=
NEXT_PUBLIC_CLOUDINARY_API_KEY=
NEXT_PUBLIC_CLOUDINARY_API_SECRET=
RESEND_API_KEY=
```

---

## Base de datos

```bash
# Aplicar cambios de schema
npx prisma db push

# Regenerar cliente Prisma
npx prisma generate

# Abrir Prisma Studio
npx prisma studio
```

---

## Roles de usuario

| Rol | Permisos |
|-----|----------|
| `admin` | Todo: crear/editar/eliminar cualquier evento y artista, gestión de usuarios |
| `artist` | Crear y editar sus propios eventos y artistas |
| `user` | Solo lectura |

---

## Deploy en producción

El sitio corre en un contenedor Docker en la Raspberry Pi `nextcloud` (`~/lahuelladelcaminante`, puerto **3007**). nginx en el VPS lo sirve con TLS y le pasa el tráfico por un túnel WireGuard.

Para deployar `main`, ejecutar **desde tu máquina local**, con `main` limpio y al día:

```bash
bash deploy.sh --dry-run   # muestra qué archivos subiría
bash deploy.sh
```

El script:

1. Hace `rsync` del working tree a la Pi, **sin `--delete`** y sin tocar lo que vive solo allá: `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `app.env`, `db.env`, `infra/`.
2. Guarda la imagen actual como `:pre-<sha>`.
3. Corre `docker compose build web` **en la Pi** (arm64 nativo, ~15 min) y recrea el contenedor.
4. Verifica healthy y `/es` y `/de` 200. Si algo falla, vuelve a la imagen previa.

Las `NEXT_PUBLIC_*` se hornean desde los build args de `docker-compose.yml` en la Pi, no desde tu `.env.local`. El alias ssh por defecto es `web`; si el tuyo es otro, usá `PI_HOST=nextcloud bash deploy.sh`.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (public)/        # Home, eventos, artistas
│   │   ├── (protected)/     # Dashboard (crear/editar)
│   │   └── admin/           # Panel de administración
│   └── api/                 # API routes (events, artists, auth)
├── components/
│   ├── events/              # EventCard, EventList, EventForm, EventFilter
│   ├── artists/             # ArtistCarousel, ArtistForm
│   ├── dashboard/           # DashboardEventActions
│   └── layout/              # Header, Footer
└── services/
    ├── events.ts            # CRUD + cache de eventos
    ├── artists.ts           # CRUD + cache de artistas
    └── auth.ts              # Helpers de autenticación y roles
```
