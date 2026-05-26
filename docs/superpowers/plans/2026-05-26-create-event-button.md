# "Crea un Evento" Universal CTA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the "Sumate como creador/a" CTA to "Crea un evento" and make it universally visible across all auth states, with role-based routing.

**Architecture:** Pure UI + routing change.
- Inline pure helper `getCreateEventHref(role)` in `Header.tsx` (client component) maps role → href.
- The Header renders the pill in BOTH the logged-in and non-logged-in branches of `UserSlot` and `MobileDrawer`.
- The home CTA section (`(public)/page.tsx > CtaSection`) gets ONLY copy updates via i18n — no code change in the component (its button already reads `t("button")` from `home.cta.button`, and the section already renders only for non-logged-in users, so href stays `/apply` and no role logic needed there).
- i18n key `nav.becomeCreator` is renamed to `nav.createEvent` to keep the key name aligned with its value (same pattern as PR #46 which renamed `nav.forArtists` → `nav.becomeCreator`).

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind v4, next-intl 4.9.2, Better Auth (admin plugin via `useSession()` for `role`).

**Note on TDD:** The skill template assumes TDD. This repo has no test framework installed (no Vitest/Jest config, no `tests/` directory). Per the user-instructions-over-skills priority of `using-superpowers`, I replace TDD steps with `npm run build` (type-check + compile) plus a manual smoke check of the rendered HTML on the dev server. Adding test infrastructure is out of scope for this PR.

**Spec reference:** `docs/superpowers/specs/2026-05-26-create-event-button-design.md` (commit `e384b72` on this branch).

---

### Task 1: i18n updates — rename `nav.becomeCreator` → `nav.createEvent` and update `home.cta` copy

**Files:**
- Modify: `src/messages/es.json`
- Modify: `src/messages/en.json`
- Modify: `src/messages/de.json`

- [ ] **Step 1: Edit `src/messages/es.json`** — rename the `nav.becomeCreator` line and update the three `home.cta` strings.

  Replace:
  ```
      "becomeCreator": "Sumate como creador/a",
  ```
  with:
  ```
      "createEvent": "Crea un evento",
  ```

  Then in the `home.cta` block, replace:
  ```
      "cta": {
        "eyebrow": "PARA ARTISTAS Y ORGANIZADORES",
        "title": "¿Tocás música latina? Sumate a la huella.",
        "button": "Sumate como creador/a"
      },
  ```
  with:
  ```
      "cta": {
        "eyebrow": "PUBLICÁ TUS EVENTOS",
        "title": "¿Organizás shows de música latina? Hacelos visibles.",
        "button": "Crea un evento"
      },
  ```

- [ ] **Step 2: Edit `src/messages/en.json`** — same shape, English values.

  Replace:
  ```
      "becomeCreator": "Become a creator",
  ```
  with:
  ```
      "createEvent": "Create an event",
  ```

  In `home.cta`, replace the three values:
  ```
      "cta": {
        "eyebrow": "FOR ARTISTS AND PROMOTERS",
        "title": "Play Latin music? Join la huella.",
        "button": "Become a creator"
      },
  ```
  with:
  ```
      "cta": {
        "eyebrow": "PUBLISH YOUR EVENTS",
        "title": "Putting on Latin music shows? Make them visible.",
        "button": "Create an event"
      },
  ```

- [ ] **Step 3: Edit `src/messages/de.json`** — same shape, German values.

  Replace:
  ```
      "becomeCreator": "Werde Creator",
  ```
  with:
  ```
      "createEvent": "Event erstellen",
  ```

  In `home.cta`, replace:
  ```
      "cta": {
        "eyebrow": "FÜR KÜNSTLER UND VERANSTALTER",
        "title": "Spielst du lateinamerikanische Musik? Werde Teil von la huella.",
        "button": "Werde Creator"
      },
  ```
  with:
  ```
      "cta": {
        "eyebrow": "VERÖFFENTLICHE DEINE EVENTS",
        "title": "Organisierst du Latin-Music-Shows? Mach sie sichtbar.",
        "button": "Event erstellen"
      },
  ```

- [ ] **Step 4: Verify JSON validity in the three files**

  Run:
  ```bash
  python3 -c "import json; [json.load(open(f'src/messages/{l}.json')) for l in ['es','en','de']]; print('JSON OK')"
  ```
  Expected output: `JSON OK`.

- [ ] **Step 5: Confirm the rename landed cleanly**

  Run:
  ```bash
  grep -n "becomeCreator\|createEvent" src/messages/*.json
  ```
  Expected: 3 lines, each `"createEvent": "..."`, NO `becomeCreator` left.

- [ ] **Step 6: Confirm there are no orphan callers of `becomeCreator`** (the rename will be picked up by Task 2; this is just sanity).

  Run:
  ```bash
  grep -rn "becomeCreator" src --include="*.ts" --include="*.tsx"
  ```
  Expected: 2 matches in `src/components/layout/Header.tsx` (lines `t("becomeCreator")` — these get fixed in Task 2). NO other files.

---

### Task 2: Header.tsx — universal "Crea un evento" pill in all states + helper

**Files:**
- Modify: `src/components/layout/Header.tsx`

**Context for the engineer:** `Header.tsx` is a `"use client"` component. It uses `useSession()` from Better Auth's React client (`@/lib/auth-client`) — the admin plugin makes `session.user.role` available client-side. The file already has a local pure helper `getPanelAccess(session)` in the same style as what we'll add (`getCreateEventHref(role)`). Read those first (~line 150-170) to match the convention.

**The pill style** is already in use in the non-logged-in branch of `UserSlot` (look for the `<Link href="/apply" ...>{t("becomeCreator")}</Link>` block in desktop, ~line 188-198). It uses `bg-brand text-on-brand rounded-pill px-l py-xs text-body-s font-semibold` + hover/focus rings. Reuse the exact same class composition for the new pill in the logged-in branch — do not invent new styles.

- [ ] **Step 1: Add the `getCreateEventHref` helper at module scope**

  Find this existing helper around line 156-169:
  ```tsx
  function getPanelAccess(session: SessionLike | null | undefined) {
    const role = session?.user?.role?.toLowerCase()
    return {
      canSeeDashboard: role === "creator" || role === "admin",
      canSeeAdmin: role === "admin",
    }
  }
  ```

  Add this directly below it (still at module scope, before `interface UserSlotProps`):

  ```tsx
  /**
   * Destino del botón "Crea un evento" según el rol de la sesión.
   * Creator/admin van directo al form de crear evento; el resto cae a
   * `/apply` (página pública que maneja signup + apply como creator).
   * Mismo patrón client-safe que `getPanelAccess` — sin importar
   * `services/auth.ts` (que es `server-only`).
   */
  function getCreateEventHref(role: string | null | undefined): string {
    const r = role?.toLowerCase()
    return r === "creator" || r === "admin"
      ? "/dashboard/events/create"
      : "/apply"
  }
  ```

- [ ] **Step 2: UserSlot — non-logged-in branch — rename the existing pill's i18n key + helper-based href**

  Find the existing non-logged-in branch of `UserSlot` (~line 178-201):

  ```tsx
  if (!session) {
    return (
      <div className="flex items-center gap-m">
        <Link
          href="/sign-in"
          className="text-body-s text-fg-secondary hover:text-fg-primary transition-colors duration-200 ease-out"
        >
          {t("signIn")}
        </Link>
        <Link
          href="/apply"
          className={cn(
            "inline-flex items-center rounded-pill bg-brand text-on-brand",
            "px-l py-xs text-body-s font-semibold",
            "hover:bg-brand-dim transition-colors duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
          )}
        >
          {t("becomeCreator")}
        </Link>
      </div>
    )
  }
  ```

  Change the `<Link>` pill's `href` to use the helper and rename the i18n key:
  ```tsx
        <Link
          href={getCreateEventHref(null)}
          className={cn(
            "inline-flex items-center rounded-pill bg-brand text-on-brand",
            "px-l py-xs text-body-s font-semibold",
            "hover:bg-brand-dim transition-colors duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
          )}
        >
          {t("createEvent")}
        </Link>
  ```

- [ ] **Step 3: UserSlot — logged-in branch — insert the pill at the start of the right cluster**

  Find the logged-in branch return (~line 211-269). Currently it returns:

  ```tsx
  return (
    <div className="flex items-center gap-m">
      {canSeeDashboard && (
        <Link
          href="/dashboard"
          ...
        >
          {t("dashboard")}
        </Link>
      )}
      {canSeeAdmin && (
        <Link
          href="/admin/applications"
          ...
        >
          {t("admin")}
        </Link>
      )}
      {canSeeDashboard ? (
        <Link href="/dashboard" aria-label={t("dashboard")} ...>
          {initials ?? "·"}
        </Link>
      ) : (
        <div aria-hidden="true" className={avatarBase}>
          {initials ?? "·"}
        </div>
      )}
      <button type="button" onClick={onSignOut} ...>
        {t("signOut")}
      </button>
    </div>
  )
  ```

  Insert a new pill `<Link>` as the **first child** of the wrapping `<div>` (before `canSeeDashboard && ...`):

  ```tsx
        <Link
          href={getCreateEventHref(session.user?.role)}
          className={cn(
            "inline-flex items-center rounded-pill bg-brand text-on-brand",
            "px-l py-xs text-body-s font-semibold",
            "hover:bg-brand-dim transition-colors duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
          )}
        >
          {t("createEvent")}
        </Link>
  ```

  Note: `session` is guaranteed non-null in this branch (the function early-returns for `!session`). `session.user?.role` is `string | null | undefined`; the helper handles all three.

- [ ] **Step 4: MobileDrawer — non-logged-in branch — same rename + helper-based href**

  Find the non-logged-in branch of `MobileDrawer` (~line 424-444). It contains a pill `<Link>` analogous to UserSlot:

  ```tsx
            <Link
              href="/apply"
              onClick={onClose}
              className={cn(
                "inline-flex items-center justify-center rounded-pill",
                "bg-brand text-on-brand px-l py-s text-body-s font-semibold",
                "hover:bg-brand-dim transition-colors duration-200 ease-out"
              )}
            >
              {t("becomeCreator")}
            </Link>
  ```

  Replace with:
  ```tsx
            <Link
              href={getCreateEventHref(null)}
              onClick={onClose}
              className={cn(
                "inline-flex items-center justify-center rounded-pill",
                "bg-brand text-on-brand px-l py-s text-body-s font-semibold",
                "hover:bg-brand-dim transition-colors duration-200 ease-out"
              )}
            >
              {t("createEvent")}
            </Link>
  ```

- [ ] **Step 5: MobileDrawer — logged-in branch — insert pill before the existing `canSeeDashboard` block**

  Find the logged-in branch of `MobileDrawer` (~line 446-491). Currently it starts with:

  ```tsx
            <div className="flex flex-col gap-xs">
              {canSeeDashboard && (
                <Link
                  href="/dashboard"
                  ...
                >
                  {t("dashboard")}
                </Link>
              )}
              ...
            </div>
  ```

  Insert a new pill `<Link>` as the **first child** of that `<div className="flex flex-col gap-xs">`:

  ```tsx
              <Link
                href={getCreateEventHref(session.user?.role)}
                onClick={onClose}
                className={cn(
                  "inline-flex items-center justify-center rounded-pill",
                  "bg-brand text-on-brand px-l py-s text-body-s font-semibold",
                  "hover:bg-brand-dim transition-colors duration-200 ease-out"
                )}
              >
                {t("createEvent")}
              </Link>
  ```

  Note: `session` non-null is guaranteed by the surrounding `!session ? ... : ...` ternary.

- [ ] **Step 6: Verify no `becomeCreator` reference remains anywhere**

  Run:
  ```bash
  grep -rn "becomeCreator" src --include="*.ts" --include="*.tsx" --include="*.json"
  ```
  Expected: NO matches.

- [ ] **Step 7: Verify `createEvent` references are exactly where expected**

  Run:
  ```bash
  grep -rn "createEvent\|getCreateEventHref" src --include="*.ts" --include="*.tsx" --include="*.json"
  ```
  Expected:
  - 3 hits in `src/messages/{es,en,de}.json` (key `createEvent`)
  - 1 hit in `src/components/layout/Header.tsx` for the function definition
  - 4 hits in `src/components/layout/Header.tsx` for `getCreateEventHref(...)` calls (1 in each of 4 pill renders)
  - 4 hits in `src/components/layout/Header.tsx` for `t("createEvent")` (1 in each of 4 pill renders)

  Total in Header.tsx: 9. Total across repo: 12.

---

### Task 3: Build + verify + commit

**Files:** None modified in this task — verification + commit only.

- [ ] **Step 1: Type-check + build with Node 22**

  Run:
  ```bash
  export PATH="/Users/kilo/.nvm/versions/node/v22.13.1/bin:$PATH" && npm run build 2>&1 | tail -5
  ```
  Expected: build completes; last lines show route legend ending in `ƒ  (Dynamic)  server-rendered on demand`. No type errors.

- [ ] **Step 2: Verify diff is exactly the expected files**

  Run:
  ```bash
  git diff --stat
  ```
  Expected: 4 files changed —
  - `src/components/layout/Header.tsx`
  - `src/messages/es.json`
  - `src/messages/en.json`
  - `src/messages/de.json`

  If any other file appears, stop and investigate.

- [ ] **Step 3: Commit (signed)**

  Run:
  ```bash
  git add src/components/layout/Header.tsx src/messages/es.json src/messages/en.json src/messages/de.json && git commit -S -m "$(cat <<'EOF'
  feat(header): universal "Crea un evento" CTA with role-based routing

  Rename the "Sumate como creador/a" button to "Crea un evento" and show
  it in all auth states. Creators and admins are routed to
  /dashboard/events/create directly; non-creators (and not-logged-in)
  go to /apply.

  Header pill is now rendered in both the non-logged-in and logged-in
  branches of UserSlot and MobileDrawer. Routing uses a new inline
  helper getCreateEventHref(role), client-safe (services/auth.ts is
  server-only, so the role check lives next to getPanelAccess in
  Header.tsx). Extraction to a shared @/lib/roles.ts remains as the
  follow-up flagged by the architecture-reviewer in PR #44.

  Home CTA section is unchanged structurally (still rendered only for
  non-logged-in users, still routes to /apply); only the strings change
  to match the organizer-first framing — eyebrow "PUBLICÁ TUS EVENTOS",
  title "¿Organizás shows de música latina? Hacelos visibles.", button
  "Crea un evento".

  i18n key nav.becomeCreator is renamed to nav.createEvent to keep the
  key name aligned with the value (same pattern as PR #46 which renamed
  nav.forArtists → nav.becomeCreator).

  Spec: docs/superpowers/specs/2026-05-26-create-event-button-design.md
  Plan: docs/superpowers/plans/2026-05-26-create-event-button.md
  EOF
  )"
  ```
  Expected: commit created with signed signature (Bitwarden prompt may appear; user approves).

- [ ] **Step 4: Manual smoke test against the dev server (optional but recommended)**

  If a dev server is running on :3000 (the user's own dev server or one started for verification), curl the home in the 3 locales and confirm the new copy is present:

  ```bash
  for loc in es en de; do
    code=$(curl -s -o /tmp/h_$loc.html -w "%{http_code}" --max-time 15 http://localhost:3000/$loc)
    echo "$loc → HTTP $code"
    grep -oE "Crea un evento|Create an event|Event erstellen|Sumate como creador|Become a creator|Werde Creator" /tmp/h_$loc.html | sort -u
  done
  ```
  Expected: HTTP 200 in each locale; new strings present, old strings absent (note: the old `nav.becomeCreator` was renamed so the OLD value won't even be in the i18n blob anymore).

  If no dev server is running, skip this step. Browser verification with real auth sessions is documented in the spec's "Manual testing checklist" — that requires accounts and is the user's responsibility post-merge.

---

## Self-Review

**1. Spec coverage:** Every section of the spec is covered:
- ✅ Routing — Task 2 Step 1 (helper) + Steps 2-5 (consumer).
- ✅ Header layout per state — Steps 2-5 cover non-logged-in / logged-in × desktop / mobile.
- ✅ Home CTA section — covered by Task 1 (i18n-only change; spec confirms no component code change needed).
- ✅ Copy (3 locales) — Task 1 Steps 1-3.
- ✅ Files touched — match exactly (Task 3 Step 2 verifies).
- ✅ i18n key rename — Task 1 + Task 2 work together; Step 6 of Task 2 verifies no `becomeCreator` left.

**2. Placeholder scan:** No TBD / TODO / "implement later" / "similar to Task N". All steps have concrete commands and code. ✅

**3. Type consistency:** `getCreateEventHref(role: string | null | undefined): string` is consistent across all callsites — non-logged-in branches pass `null` literal; logged-in branches pass `session.user?.role` (which has the matching type). All callsites use `t("createEvent")` consistently. ✅

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-26-create-event-button.md`. Two execution options per the writing-plans skill:

**1. Subagent-Driven (recommended by skill)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. Best when tasks are genuinely independent and the engineer wants strict isolation.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review. Best for small plans where context-handoff between subagents would add overhead.

For THIS plan (3 small tasks, ~50 lines total, single-file core change), **inline execution is the right pick** — subagent spin-up cost would dominate the actual work. But the choice is the user's.
