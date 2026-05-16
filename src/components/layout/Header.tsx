/**
 * Header — sticky top bar del sitio, presente en todas las pantallas
 * (public, protected, admin). Compuesto por:
 *  - BrandLockup horizontal (link a la home del locale activo).
 *  - Nav central con underline-on-active sangre (desktop).
 *  - LanguageSwitcher (pills siempre, compactas en mobile).
 *  - Estado de usuario: "Iniciar sesión" + "Para artistas" si no logueado;
 *    avatar/iniciales + "Sign out" si logueado.
 *  - Drawer mobile con la misma nav + estado de usuario, accesible desde
 *    botón hamburguesa.
 *
 * Es client component porque necesita:
 *  - `usePathname()` para el estado activo del nav.
 *  - `useSession()` de Better Auth para el estado de usuario.
 *  - `useState` para el drawer mobile.
 *  - El drawer se cierra automáticamente al navegar (cuando cambia el
 *    pathname) — manejado con `useEffect`.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §3 + §6.
 */

"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession, signOut } from "@/lib/auth-client"
import { useLocale } from "next-intl"
import { usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import BrandLockup from "@/components/brand/BrandLockup"
import LanguageSwitcher from "./LanguageSwitcher"

interface NavItem {
  href: string
  label: string
}

export function Header() {
  const t = useTranslations("nav")
  const locale = useLocale()
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
    { href: "/events#esta-semana", label: t("thisWeek") },
  ]

  function handleSignOut() {
    signOut({
      fetchOptions: { onSuccess: () => router.push(`/${locale}`) },
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
        <BrandLockup orientation="horizontal" href={`/${locale}`} />

        {/* Nav central — desktop only */}
        <nav className="hidden md:flex items-center gap-l mx-auto">
          {navItems.map((item) => {
            const localizedHref = `/${locale}${item.href}`
            const isActive = isNavItemActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={localizedHref}
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
            locale={locale}
            t={t}
            onSignOut={handleSignOut}
          />
        </div>

        {/* Mobile: switcher compacto + hamburguesa */}
        <div className="md:hidden flex items-center gap-s ml-auto">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-label={drawerOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={drawerOpen}
            aria-controls="header-mobile-drawer"
            className={cn(
              "inline-flex items-center justify-center w-9 h-9 rounded-m",
              "text-2xl leading-none text-fg-primary",
              "hover:bg-bg-surface-2 transition-colors duration-200 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
            )}
          >
            {drawerOpen ? "×" : "≡"}
          </button>
        </div>
      </div>

      {/* Drawer mobile */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navItems={navItems}
        locale={locale}
        pathname={pathname}
        session={session}
        t={t}
        onSignOut={handleSignOut}
      />
    </header>
  )
}

/** Match exacto contra el segmento path-sans-locale. "/events" matchea
 * la página de eventos y sus hijos (`/events/...`). El hash no afecta el
 * matching del nav (el pathname no incluye hashes). */
function isNavItemActive(pathname: string, itemHref: string): boolean {
  const [path] = itemHref.split("#")
  if (path === "/") return pathname === "/"
  return pathname === path || pathname.startsWith(`${path}/`)
}

interface SessionLike {
  user?: { name?: string | null } | null
}

interface UserSlotProps {
  session: SessionLike | null | undefined
  locale: string
  t: (key: string) => string
  onSignOut: () => void
}

function UserSlot({ session, locale, t, onSignOut }: UserSlotProps) {
  if (!session) {
    return (
      <div className="flex items-center gap-m">
        <Link
          href={`/${locale}/sign-in`}
          className="text-body-s text-fg-secondary hover:text-fg-primary transition-colors duration-200 ease-out"
        >
          {t("signIn")}
        </Link>
        <Link
          href={`/${locale}/apply`}
          className={cn(
            "inline-flex items-center rounded-pill bg-brand text-on-brand",
            "px-l py-xs text-body-s font-semibold",
            "hover:bg-brand-dim transition-colors duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
          )}
        >
          {t("forArtists")}
        </Link>
      </div>
    )
  }

  const initials = getInitials(session.user?.name ?? null)

  return (
    <div className="flex items-center gap-s">
      <div
        aria-hidden="true"
        className={cn(
          "w-9 h-9 rounded-pill bg-bg-surface-2 border border-border",
          "flex items-center justify-center text-caption font-semibold text-fg-primary"
        )}
      >
        {initials ?? "·"}
      </div>
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
      .map((part) => part[0]!)
      .join("")
      .toUpperCase()
      .slice(0, 2) || null
  )
}

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  navItems: NavItem[]
  locale: string
  pathname: string
  session: SessionLike | null | undefined
  t: (key: string) => string
  onSignOut: () => void
}

function MobileDrawer({
  open,
  onClose,
  navItems,
  locale,
  pathname,
  session,
  t,
  onSignOut,
}: MobileDrawerProps) {
  // Lock body scroll cuando el drawer está abierto.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      {/* Overlay debajo del header (offset por header-h). */}
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

      <div
        id="header-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={cn(
          "md:hidden fixed inset-x-0 z-50 bg-bg-page border-b border-border",
          "transition-transform duration-200 ease-out",
          open ? "translate-y-0" : "-translate-y-full"
        )}
        style={{ top: "var(--layout-header-h)" }}
      >
        <nav className="flex flex-col gap-xs px-l py-l">
          {navItems.map((item) => {
            const localizedHref = `/${locale}${item.href}`
            const isActive = isNavItemActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={localizedHref}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "text-body-l py-s rounded-m px-m transition-colors",
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
                href={`/${locale}/sign-in`}
                className="text-body-s text-fg-secondary hover:text-fg-primary py-s"
              >
                {t("signIn")}
              </Link>
              <Link
                href={`/${locale}/apply`}
                className={cn(
                  "inline-flex items-center justify-center rounded-pill",
                  "bg-brand text-on-brand px-l py-s text-body-s font-semibold",
                  "hover:bg-brand-dim transition-colors duration-200 ease-out"
                )}
              >
                {t("forArtists")}
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-m">
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
          )}
        </div>
      </div>
    </>
  )
}
