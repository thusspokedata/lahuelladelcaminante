# La Huella del Caminante

Portal de eventos de música latinoamericana en Alemania (Berlín, Múnich, Hamburgo y más). Conecta artistas y público con la escena latina en Europa.

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

El proyecto corre en `root@187.33.155.194` bajo PM2 en el puerto **3002**, servido por nginx con SSL.

Para deployar una nueva versión, ejecutar **desde tu máquina local**:

```bash
bash deploy.sh
```

El script hace: `git pull` en el VPS → `npm run build` local → `rsync .next/` al VPS → `pm2 restart`.

> **Por qué se buildea localmente:** el VPS tiene 1GB de RAM, insuficiente para el build de Next.js 16. El build corre en tu máquina y solo se sube la carpeta `.next` compilada via rsync. Esto también significa que los `node_modules` del VPS nunca se tocan durante el deploy, evitando corrupción de binarios nativos (problema que ocurrió con `@swc/core`, `lightningcss`, etc. al quedarse sin memoria durante `npm install`).

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
