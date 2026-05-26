# Spec: "Crea un evento" CTA universal (header + home)

**Date:** 2026-05-26
**Status:** Design approved, ready for implementation plan
**Origin:** Brainstorming session via Superpowers `brainstorming` skill, approved by the dev.

## Problem

El botón rojo del header y el botón del home CTA section dicen hoy "Sumate como creador/a" y solo se muestran a usuarios no logueados. Limitaciones:

- **No es accionable.** "Sumate" describe un acto meta, no la acción que se quiere que la persona haga.
- **Excluye a usuarios logueados que ya pueden crear eventos** (creators y admins): su path actual al form de "crear evento" es largo (Mi panel → /dashboard → sidebar → /dashboard/events → "Crear").
- **El framing apunta a artistas tocando**, no a organizadores publicando — el copy actual del home CTA no refleja el público real del portal (gente que organiza eventos y los publica).

## Decision

Renombrar el botón a **"Crea un evento"** y hacerlo **universal** (visible en todos los estados de auth), con ruteo según rol. Rebrandear el bloque del home CTA para reforzar el mensaje organizador-first.

## Routing

Helper puro inline `getCreateEventHref(role)`:

| `role` | `href` |
|---|---|
| `"creator"` | `/dashboard/events/create` |
| `"admin"` | `/dashboard/events/create` |
| `"user"` / `null` / `undefined` | `/apply` |

Notas:
- `/apply` es página pública. Recibe tanto a no-logueados (signup + apply) como a logueados con `role: user` (apply como creator).
- El helper se usa solo en el Header (el botón del home CTA section, que ya es no-logueado-only, va con `href` fijo `/apply`).
- Inline x1 — extracción a `@/lib/roles.ts` client-safe queda como follow-up del review del PR #44 (no en este PR).

## Header — layout por estado

Right cluster del header en desktop. El pill rojo "Crea un evento" abre el cluster como acción primaria; las demás cosas quedan donde están.

| Estado | Right cluster (desktop) |
|---|---|
| No logueado | `[Iniciar sesión] [Crea un evento pill]` *(igual que hoy, solo cambia el texto)* |
| Logged-in `user` | `[Crea un evento pill] (avatar decorativo) [Sign out]` |
| Logged-in `creator` | `[Crea un evento pill] [Mi panel] (avatar→/dashboard) [Sign out]` |
| Logged-in `admin` | `[Crea un evento pill] [Mi panel] [Admin] (avatar→/dashboard) [Sign out]` |

Mobile drawer: análogo. El pill aparece prominente en la sección user del drawer, antes de los demás links.

## Home CTA section

La sección sigue renderizando **solo para no-logueados** (`{!user ? <CtaSection /> : null}`). Su visibilidad no cambia. Solo cambian los strings:

- `eyebrow`: `PUBLICÁ TUS EVENTOS`
- `title`: `¿Organizás shows de música latina? Hacelos visibles.`
- `button`: `Crea un evento` (href fijo `/apply`, la sección solo se ve no-logueada)

## Copy — i18n (3 locales)

| Key | ES | EN | DE |
|---|---|---|---|
| `nav.createEvent` *(rename desde `nav.becomeCreator`)* | Crea un evento | Create an event | Event erstellen |
| `home.cta.eyebrow` | PUBLICÁ TUS EVENTOS | PUBLISH YOUR EVENTS | VERÖFFENTLICHE DEINE EVENTS |
| `home.cta.title` | ¿Organizás shows de música latina? Hacelos visibles. | Putting on Latin music shows? Make them visible. | Organisierst du Latin-Music-Shows? Mach sie sichtbar. |
| `home.cta.button` *(solo cambia valor)* | Crea un evento | Create an event | Event erstellen |

El rename de `nav.becomeCreator` → `nav.createEvent` mantiene el patrón de PRs anteriores (en PR #46 se renombró `forArtists` → `becomeCreator` por el mismo motivo: que el nombre de la key matchee el significado del valor).

## Files touched

- `src/components/layout/Header.tsx` — UserSlot (desktop) + MobileDrawer: agregar el pill "Crea un evento" en branch logueada y no-logueada; helper `getCreateEventHref` inline; rename de `t("becomeCreator")` → `t("createEvent")`.
- `src/app/[locale]/(public)/page.tsx` — `CtaSection`: copy actualizado (eyebrow + title + button); sin cambio en visibilidad ni en href.
- `src/messages/{es,en,de}.json` — rename `nav.becomeCreator` → `nav.createEvent` con valor nuevo; update `home.cta.{eyebrow,title,button}`.

## Edge cases

- **Session-loading flash** (Header es client component): inicialmente `session = undefined` → el helper cae en "no logueado" → href `/apply`. Cuando la sesión carga (un tick después), si es creator/admin el href switche a `/dashboard/events/create`. Mismo patrón que la lógica de avatar/Mi panel del PR #44 — aceptable.
- **`role` desconocido / vacío** → `/apply` (default seguro).
- **Logged-in `user` (no creator) que clickea "Crea un evento"** → va a `/apply`. La copy es ligeramente aspiracional para ese caso (no puede crear todavía), pero la página `/apply` aclara el flujo (es la página de "aplicar como creator"). Aceptable.

## Out of scope

- Extracción de `@/lib/roles.ts` client-safe (follow-up de PR #44).
- Cambios en la página `/apply` (ya es pública y maneja ambos casos).
- Tests automatizados (el repo no los tiene).
- Restyling del pill (queda con el estilo actual).

## Manual testing checklist

| Estado | Header click | CTA section click |
|---|---|---|
| No logueado | → `/apply` | → `/apply` |
| Logged-in `user` | → `/apply` | (sección no renderiza) |
| Logged-in `creator` | → `/dashboard/events/create` | (sección no renderiza) |
| Logged-in `admin` | → `/dashboard/events/create` | (sección no renderiza) |

Verificar adicionalmente que el copy nuevo se muestra correctamente en los 3 locales (ES/EN/DE) tanto en el header como en el home CTA section.
