/**
 * Header — sticky top bar del sitio, presente en todas las pantallas
 * (public, protected, admin). Compuesto por:
 *  - BrandLockup horizontal (link a la home del locale activo).
 *  - Nav central con underline-on-active sangre (desktop).
 *  - LanguageSwitcher (pills siempre, compactas en mobile).
 *  - Pill "Crea un evento" universal (todos los estados de auth). Rutea
 *    según rol vía `getCreateEventHref`: creator/admin → form, resto →
 *    `/apply`. Para no logueados se suma "Iniciar sesión"; para logueados
 *    se suma avatar/iniciales + "Sign out", y para creators/admins el
 *    link "Mi panel" (→ `/dashboard`) con el avatar también linkeando al
 *    dashboard; los admins ven además un link a `/admin`.
 *  - Drawer mobile con la misma nav + estado de usuario, accesible desde
 *    botón hamburguesa.
 *
 * Es client component porque necesita:
 *  - `usePathname()` para el estado activo del nav.
 *  - `useSession()` de Better Auth para el estado de usuario.
 *  - `useState` para el drawer mobile.
 *  - El drawer se cierra automáticamente al navegar (cuando cambia el
 *    pathname) — manejado con `useEffect`.
 *  - Focus management: Escape cierra el drawer y restaura foco al
 *    hamburger; al abrir, el foco se mueve al primer link del drawer.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §3 + §6.
 */

"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useSession, signOut } from "@/lib/auth-client"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import BrandLockup from "@/components/brand/BrandLockup"
import LanguageSwitcher from "./LanguageSwitcher"

interface NavItem {
  href: string
  /** `true` si el item linkea a una sección con hash (`#`). Esos no se
   * pueden marcar activos basándose solo en el pathname — el hash no se
   * lee en server-side. Hasta tener un detector client-side basado en
   * `window.location.hash`, los tratamos como "nunca activos por path". */
  hashOnly?: boolean
  label: string
}

export function Header() {
  const t = useTranslations("nav")
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Cerrar el drawer al navegar (cuando el path cambia).
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  const navItems: NavItem[] = [
    { href: "/events", label: t("events") },
    { href: "/artists", label: t("artists") },
    { href: "/events#esta-semana", hashOnly: true, label: t("thisWeek") },
  ]

  function handleSignOut() {
    signOut({
      fetchOptions: { onSuccess: () => router.push("/") },
    })
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-border bg-bg-page"
      style={{ height: "var(--layout-header-h)" }}
    >
      <div
        className="mx-auto h-full flex items-center gap-l"
        style={{
          maxWidth: "var(--layout-max-w)",
          paddingLeft: "var(--layout-gutter)",
          paddingRight: "var(--layout-gutter)",
        }}
      >
        <BrandLockup orientation="horizontal" href="/" />

        {/* Nav central — desktop only */}
        <nav className="hidden md:flex items-center gap-l mx-auto">
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "text-body-s font-medium pb-[2px] border-b-2 transition-colors duration-200 ease-out",
                  isActive
                    ? "border-brand text-fg-primary"
                    : "border-transparent text-fg-secondary hover:text-fg-primary"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Derecha: switcher + estado usuario — desktop */}
        <div className="hidden md:flex items-center gap-l ml-auto">
          <LanguageSwitcher />
          <UserSlot
            session={session}
            t={t}
            onSignOut={handleSignOut}
          />
        </div>

        {/* Mobile: switcher compacto + hamburguesa */}
        <div className="md:hidden flex items-center gap-s ml-auto">
          <LanguageSwitcher compact />
          <HamburgerButton
            open={drawerOpen}
            onToggle={() => setDrawerOpen((prev) => !prev)}
            t={t}
          />
        </div>
      </div>

      {/* Drawer mobile */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navItems={navItems}
        pathname={pathname}
        session={session}
        t={t}
        onSignOut={handleSignOut}
      />
    </header>
  )
}

/** Match contra el pathname-sans-locale (devuelto por `usePathname` de
 * `@/i18n/navigation`). Para items con hash (`hashOnly: true`) no
 * intentamos matchear basándonos en el path — el hash es ambiguo entre
 * varias rutas y leerlo desde el server-rendered no es posible. */
function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.hashOnly) return false
  const path = item.href
  if (path === "/") return pathname === "/"
  return pathname === path || pathname.startsWith(`${path}/`)
}

interface SessionLike {
  user?: { name?: string | null; role?: string | null } | null
}

/**
 * Acceso al panel derivado del rol de la sesión. Client-safe a propósito:
 * `services/auth.ts` (donde viven `isCreatorOrAdmin`/`isAdmin`) es
 * `server-only` y no se puede importar en este client component. El
 * `role` llega del plugin `admin` de Better Auth vía `useSession()`.
 */
function getPanelAccess(session: SessionLike | null | undefined) {
  const role = session?.user?.role?.toLowerCase()
  return {
    canSeeDashboard: role === "creator" || role === "admin",
    canSeeAdmin: role === "admin",
  }
}

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

interface UserSlotProps {
  session: SessionLike | null | undefined
  t: (key: string) => string
  onSignOut: () => void
}

function UserSlot({ session, t, onSignOut }: UserSlotProps) {
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
      </div>
    )
  }

  const initials = getInitials(session.user?.name ?? null)
  const { canSeeDashboard, canSeeAdmin } = getPanelAccess(session)

  const avatarBase = cn(
    "w-9 h-9 rounded-pill bg-bg-surface-2 border border-border",
    "flex items-center justify-center text-caption font-semibold text-fg-primary"
  )

  return (
    <div className="flex items-center gap-m">
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
      {canSeeDashboard && (
        <Link
          href="/dashboard"
          className={cn(
            "text-body-s font-medium text-creator hover:text-fg-primary",
            "transition-colors duration-200 ease-out rounded-s px-xs",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
          )}
        >
          {t("dashboard")}
        </Link>
      )}
      {canSeeAdmin && (
        <Link
          href="/admin/applications"
          className={cn(
            "text-body-s text-fg-secondary hover:text-fg-primary",
            "transition-colors duration-200 ease-out rounded-s px-xs",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
          )}
        >
          {t("admin")}
        </Link>
      )}
      {canSeeDashboard ? (
        <Link
          href="/dashboard"
          aria-label={t("dashboard")}
          className={cn(
            avatarBase,
            "hover:border-creator transition-colors duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
          )}
        >
          {initials ?? "·"}
        </Link>
      ) : (
        <div aria-hidden="true" className={avatarBase}>
          {initials ?? "·"}
        </div>
      )}
      <button
        type="button"
        onClick={onSignOut}
        className={cn(
          "text-body-s text-fg-secondary hover:text-fg-primary",
          "transition-colors duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page rounded-s px-xs"
        )}
      >
        {t("signOut")}
      </button>
    </div>
  )
}

function getInitials(name: string | null): string | null {
  if (!name) return null
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2) || null
  )
}

interface HamburgerButtonProps {
  open: boolean
  onToggle: () => void
  t: (key: string) => string
}

function HamburgerButton({ open, onToggle, t }: HamburgerButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? t("closeMenu") : t("openMenu")}
      aria-expanded={open}
      aria-controls="header-mobile-drawer"
      data-header-hamburger
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-m",
        "text-2xl leading-none text-fg-primary",
        "hover:bg-bg-surface-2 transition-colors duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
      )}
    >
      {open ? "×" : "≡"}
    </button>
  )
}

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  navItems: NavItem[]
  pathname: string
  session: SessionLike | null | undefined
  t: (key: string) => string
  onSignOut: () => void
}

function MobileDrawer({
  open,
  onClose,
  navItems,
  pathname,
  session,
  t,
  onSignOut,
}: MobileDrawerProps) {
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null)
  const { canSeeDashboard, canSeeAdmin } = getPanelAccess(session)

  // Lock body scroll cuando el drawer está abierto + cerrar con Escape +
  // gestionar foco (al abrir, mover al primer link; al cerrar, restaurar
  // al hamburger). El `inert={!open}` sobre el div del drawer se aplica
  // abajo en el JSX y descalifica el subtree del orden de tabulación
  // cuando está cerrado (los Links/buttons internos no son focusables
  // hasta que el drawer abra). TODO pendiente para un PR de overlays:
  // focus trap completo (Tab cycling adentro del drawer) e `inert`
  // sobre el resto del DOM cuando se introduzca un primitivo dialog.
  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    firstLinkRef.current?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener("keydown", onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
      const hamburger = document.querySelector<HTMLButtonElement>(
        "[data-header-hamburger]"
      )
      hamburger?.focus()
    }
  }, [open, onClose])

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "md:hidden fixed inset-x-0 bottom-0 bg-bg-page/80 backdrop-blur-sm z-40",
          "transition-opacity duration-200 ease-out",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{ top: "var(--layout-header-h)" }}
      />

      {/* Sin role="dialog"/aria-modal mientras el componente no tenga un
          focus trap real. El `<nav>` interno ya aporta semántica de
          navegación; `inert` cubre el orden de tabulación cuando está
          cerrado. Cuando se introduzca el dialog primitive compartido
          (PR de overlays), volvemos a marcar role="dialog" junto con
          el focus trap + inert global. */}
      <div
        id="header-mobile-drawer"
        inert={!open}
        className={cn(
          "md:hidden fixed inset-x-0 z-50 bg-bg-page border-b border-border",
          "transition-transform duration-200 ease-out",
          open ? "translate-y-0" : "-translate-y-full"
        )}
        style={{ top: "var(--layout-header-h)" }}
      >
        <nav className="flex flex-col gap-xs px-l py-l">
          {navItems.map((item, index) => {
            const isActive = isNavItemActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={index === 0 ? firstLinkRef : undefined}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "text-body-l py-s rounded-m px-m transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
                  isActive
                    ? "bg-bg-surface-2 text-fg-primary font-semibold"
                    : "text-fg-secondary hover:bg-bg-surface-2 hover:text-fg-primary"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border px-l py-l">
          {!session ? (
            <div className="flex flex-col gap-s">
              <Link
                href="/sign-in"
                onClick={onClose}
                className="text-body-s text-fg-secondary hover:text-fg-primary py-s"
              >
                {t("signIn")}
              </Link>
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
            </div>
          ) : (
            <div className="flex flex-col gap-xs">
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
              {canSeeDashboard && (
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className={cn(
                    "text-body-l py-s rounded-m px-m transition-colors",
                    "text-creator hover:bg-bg-surface-2",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
                  )}
                >
                  {t("dashboard")}
                </Link>
              )}
              {canSeeAdmin && (
                <Link
                  href="/admin/applications"
                  onClick={onClose}
                  className={cn(
                    "text-body-l py-s rounded-m px-m transition-colors",
                    "text-fg-secondary hover:bg-bg-surface-2 hover:text-fg-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
                  )}
                >
                  {t("admin")}
                </Link>
              )}
              <div className="flex items-center justify-between gap-m px-m pt-s">
                <span className="text-body-s text-fg-secondary">
                  {session.user?.name ?? ""}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-body-s text-fg-secondary hover:text-fg-primary py-s"
                >
                  {t("signOut")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
