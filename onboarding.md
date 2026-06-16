Contexto para trabajar en La Huella del Caminante. (Actualizado: junio 2026)

PROYECTO
Portal de eventos de música latinoamericana en vivo en Berlín. Repo local: <LOCAL_REPO_PATH>
Stack: Next.js 16 (App Router — el ex-middleware.ts ahora es proxy.ts), React 19,
TypeScript, Tailwind v4, Prisma 7, Better Auth (1.6.x), next-intl (ES/EN/DE). DB:
Neon (PostgreSQL serverless). Auth: solo email/password (Google OAuth fue removido).
Marca: rojo sangre #D43029 (--color-brand), crema #FFE6E3 (--color-on-brand);
sitio dark-themed (--bg-page #0e0407). Logo en prod: el "rupestre" (figuras crema
en círculo sobre fondo tierra con huella dorada — BrandMark, favicon/icon nuevos).

CÓMO TRABAJAMOS
- Te paso specs detallados de PR. Vos: branch nueva desde main actualizado,
  implementás, verificás, commits atómicos, abrís PR contra main, esperás CodeRabbit.
- Cada cambio = su branch + su PR. NUNCA mergear a main sin mi OK explícito.
- SIEMPRE esperar la revisión de CodeRabbit antes de proponer merge (incluso hotfix).
- Antes de abrir PR, correr los agentes de review on-demand que apliquen al diff
  (architecture-reviewer, security-reviewer, api-contract-reviewer,
  design-system-reviewer, a11y-reviewer, i18n-reviewer, performance-reviewer,
  prisma-migrations-reviewer) y resolver lo que marquen. Aplicá sus hallazgos con
  criterio: si una sugerencia es técnicamente peor, pusheá back con fundamento.
- Commits firmados: git commit -S (Bitwarden SSH agent — yo apruebo la firma; si
  falla con "agent refused operation", avisame que desbloquee Bitwarden y reintentás).
  NUNCA poner Co-Authored-By Claude ni atribución a Claude en commits ni PRs.
- Merges = squash (la convención del repo: main es lineal, cada commit es "... (#NN)").
- Trabajá en el repo principal, NO en worktrees (así Zed muestra lo que editás).
- Hablame en español, directo y honesto. Si algo no va a funcionar, decímelo —
  no lo maquilles.

BASE DE DATOS — LEER ESTO (crítico)
- El proyecto Neon tiene DOS branches:
  · `production` (endpoint ep-muddy-surf-al0awhfe) → la usa el VPS de prod.
  · `dev` (endpoint ep-dark-bread-al63zez1) → a la que apunta el `.env.local`
    LOCAL del repo (DATABASE_URL pooled + DIRECT_URL direct). Copia COW de prod.
- La URL de prod NO está en el `.env.local` local — vive solo en el VPS. Para saber
  a qué pega un comando, mirá el host en el output: ep-dark-bread = dev, ep-muddy-surf = prod.
- ANTES de junio 2026 NO había branch dev: el `.env.local` local apuntaba a la
  MISMA DB que prod, y una migración destructiva "de dev" (DROP COLUMN) tiró el
  sitio de prod. Por eso existe la branch dev. Aun así: ante un cambio destructivo
  de schema (drop/rename de columna), deployar el código nuevo ANTES o usar
  expand/contract — nunca dropear algo que el código viejo en vuelo todavía usa.
- Prisma 7: las URLs van en prisma.config.ts (resuelve DIRECT_URL ?? DATABASE_URL),
  NO en schema.prisma (ahí tira P1012). prisma.config.ts tiene un loadEnv que lee
  `.env.local` (Prisma CLI por sí solo solo lee `.env`).

GOTCHAS TÉCNICOS
- Usá Node 22.13.1 para builds y Prisma en local:
  export PATH="$HOME/.nvm/versions/node/v22.13.1/bin:$PATH"
  (el shell por default trae Node viejo y Prisma 7 falla). El VPS corre Node 22.x.
- El repo usa npm (package-lock.json) como lockfile real. deploy.sh usa npm.
- No hay postinstall: prisma generate → después de npm ci/install hay que correr
  prisma generate a mano o el build falla con errores de tipo.
- psql local: el DATABASE_URL de Neon trae sslmode=verify-full, que necesita un
  CA cert ausente en la Mac. Para psql ad-hoc usá sslmode=require (sigue cifrado).
  El runtime de la app y prisma db execute no tienen este problema.
- AGENTS.md del repo: "This is NOT the Next.js you know" — leé
  node_modules/next/dist/docs/ antes de tocar APIs de Next.

DEPLOY A PRODUCCIÓN
- bash deploy.sh desde local (con el PATH de Node 22) — buildea LOCAL, rsyncea
  .next/ y node_modules/ al VPS, reinstala binarios nativos Linux, corre
  `prisma migrate deploy` + `prisma generate` en el VPS, reinicia PM2. Los valores
  del VPS (host, REMOTE_DIR) están en deploy.sh.
- OJO build-time vs runtime: el build corre LOCAL, así que las NEXT_PUBLIC_* se
  congelan en el bundle desde el `.env.local` LOCAL — setearlas en el VPS no sirve.
- Cambios de schema: deploy.sh `prisma migrate deploy` SOLO aplica migraciones
  formales de prisma/migrations/. El proyecto usa db push como workflow principal,
  así que:
  · Tabla/modelo nuevo (additivo) → correr `prisma db push` en el VPS (migrate
    deploy NO lo crea si no hay migración formal).
  · Cambio que transforma datos (backfill, drop, rename) → script versionado en
    prisma/migrations-manual/ (transaccional + idempotente), aplicado a mano. En
    el VPS NO hay psql: usar `npx prisma db execute --file=<script>` (usa
    prisma.config → la DB de prod). Aplicar ANTES del restart de PM2.
- Deploy y mutaciones de servicios externos (gh pr merge, gh api, git push, ssh al
  VPS, tocar la DB) → pedime confirmación explícita por chat; un OK general no
  alcanza. (El SSH al VPS lo apruebo por Bitwarden en cada conexión.)

ANALYTICS — UMAMI (self-hosted en el VPS)
- Instancia self-hosted en el VPS: Docker Compose en /opt/umami (contenedor umami
  + postgres propio, app solo en 127.0.0.1:3005, volumen persistente). Detrás de
  nginx + TLS en https://umami.lahuelladelcaminante.de. Cookieless → sin banner.
- Es MULTI-SITIO: una instancia trackea varios sitios, cada uno con su website-id.
  Sitios dados de alta: La Huella, Sonaq (sonaq.com.ar), Viajar País
  (viajarpais.com.ar), Bel Registro (belregistro.com).
- Integración en La Huella: <Script> de Umami en src/app/[locale]/layout.tsx,
  gateado por NODE_ENV === "production" && NEXT_PUBLIC_UMAMI_WEBSITE_ID (la var
  vive en el `.env.local` LOCAL, por el build-time). CSP en next.config.ts incluye
  el origen de Umami en script-src y connect-src.
- Para sumar otro sitio: crear el website en el panel (o por API contra
  127.0.0.1:3005 con token de admin) → tomar el website-id → pegar el script con
  ese id + data-domains. La password de admin la tenés vos (guardala en Bitwarden;
  NO va en el repo).

ESTADO ACTUAL (junio 2026)
- En prod: signup público, emails de signup, páginas legales (Impressum/Datenschutz
  con sección de analytics Umami), Google OAuth removido.
- Eventos con MÚLTIPLES géneros: Event.genres String[] (antes era genre único),
  combobox multi-select creatable (Base UI) con filtrado normalizado case/acentos,
  índice GIN para el filtro público. (2 eventos viejos quedaron con género literal
  "Otros" — limpieza opcional.)
- Calendario: modelo SceneEvent, vista pública /events/calendar + panel admin de
  scene events.
- Umami analytics live (ver sección arriba). Redirect www→apex en nginx del VPS.
- Deps al día: better-auth 1.6.18, esbuild 0.28.1.
- Logo: el rupestre ESTÁ en prod (favicon/icon nuevos). El monograma "LH" se
  descartó; branch feat/brand-monogram-lh sigue en pausa (wip local).

BACKLOG / PENDIENTES
- Dependabot marca ~19 vulnerabilidades en main (varias high) → pasada de npm audit.
- Validación legal (abogado) del texto del Datenschutz, sobre todo el matiz
  "información agregada" del párrafo de Umami.
- getPastEvents no filtra isActive (decidir si corresponde).
- Branch local claude/nervous-chaplygin-d2a4a4 tiene 1 commit suelto sin mergear
  (probable intento abandonado) — revisar y borrar si no sirve.

Arrancá leyendo el estado del repo (git status, branch actual, gh pr list).
