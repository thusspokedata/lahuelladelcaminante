Contexto para trabajar en La Huella del Caminante.

PROYECTO
Portal de eventos de música latinoamericana en vivo en Alemania (Berlín, Múnich,
Hamburgo). Repo: <LOCAL_REPO_PATH>
Stack: Next.js 16 (App Router — el ex-middleware.ts ahora es proxy.ts), React 19,
TypeScript, Tailwind v4, Prisma 7, Better Auth, next-intl (ES/EN/DE). DB: Neon
(PostgreSQL serverless). Auth: solo email/password (Google OAuth fue removido).
Marca: rojo sangre #D43029 (--color-brand), crema #FFE6E3 (--color-on-brand);
sitio dark-themed (--bg-page #0e0407).

CÓMO TRABAJAMOS
- Te paso specs detallados de PR. Vos: branch nueva desde main actualizado,
  implementás, verificás, commits atómicos, abrís PR contra main, esperás CodeRabbit.
- Cada cambio = su branch + su PR. NUNCA mergear a main sin mi OK explícito.
- SIEMPRE esperar la revisión de CodeRabbit antes de proponer merge (incluso hotfix).
- Después de implementar algo sustancial, correr los agentes architecture-reviewer
  y/o security-reviewer sobre el diff antes de abrir el PR.
- Commits firmados: git commit -S (Bitwarden SSH agent — yo apruebo la firma; si
  falla, avisame que desbloquee Bitwarden). NUNCA poner Co-Authored-By Claude ni
  atribución a Claude en commits ni PRs.
- Trabajá en el repo principal, NO en worktrees (así Zed muestra lo que editás).
- Hablame en español, directo y honesto. Si algo no va a funcionar, decímelo —
  no lo maquilles.

GOTCHAS TÉCNICOS
- Usá Node 22.13.1 para builds y Prisma:
  export PATH="$HOME/.nvm/versions/node/v22.13.1/bin:$PATH"
  (el shell por default trae Node 20 y Prisma 7 falla).
- El repo usa npm (package-lock.json) como lockfile real. deploy.sh usa npm.
- No hay postinstall: prisma generate → después de npm ci/install hay que correr
  prisma generate a mano o el build falla con errores de tipo.
- AGENTS.md del repo: "This is NOT the Next.js you know" — leé
  node_modules/next/dist/docs/ antes de tocar APIs de Next.

DEPLOY A PRODUCCIÓN
- bash deploy.sh desde local (con el PATH de Node 22) — buildea local, rsyncea al
  VPS (<DEPLOY_USER>@<DEPLOY_HOST>), prisma generate en el VPS, reinicia PM2.
- Si el PR toca prisma/schema.prisma → además aplicar la migración SQL manual +
  prisma db push contra Neon.
- Deploy y mutaciones de servicios externos (gh pr merge, gh api, git push) →
  pedime confirmación explícita por chat; un OK general no alcanza.
- Los valores reales de <DEPLOY_USER>, <DEPLOY_HOST> y <LOCAL_REPO_PATH> no se
  documentan acá: conseguilos out-of-band (runbook privado / responsable del repo).

ESTADO ACTUAL
- En prod: signup público, redirect + emails de signup, páginas legales
  (Impressum/Datenschutz), Google OAuth removido, limpieza de código muerto,
  actualización de dependencias.
- PR #42 (feat/past-events-on-home) abierto — pendiente CodeRabbit/merge.
- Logo de marca SIN RESOLVER: se descartó un monograma "LH" y una ilustración de
  huella+globo+árbol (muy detallada, no funciona robusta como logo). El favicon
  rojo simple actual queda en prod. Branch feat/brand-monogram-lh en pausa.
- Backlog: getPastEvents no filtra isActive (decidir); validación legal del texto
  Datenschutz (opcional).

Arrancá leyendo el estado del repo (git status, branch actual, PRs abiertos).
