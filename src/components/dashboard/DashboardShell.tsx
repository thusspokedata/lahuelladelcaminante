/**
 * DashboardShell — layout sidebar + main para el panel del creator y el admin.
 *
 * Sidebar role-aware: el indicador del item activo se tiñe con `creator`
 * (fucsia) para creators y `brand` (sangre) para admins. Es el principal
 * recurso visual que diferencia los dos paneles sin agregar más cromo.
 *
 * En v1 implementamos SOLO la versión desktop (sidebar fija a la izquierda).
 * El comportamiento responsive en mobile (tab bar inferior + drawer
 * accesible desde un hamburger en el header) se implementa en el PR de
 * integración del dashboard, cuando ya tengamos el contenido real adentro.
 * Por eso este componente es server: no necesita estado para desktop.
 *
 * Para preparar ese split futuro, las constantes de estilo del item de nav
 * (`navItemClass`/`navItemActiveClass`) y la lista por defecto
 * (`defaultDashboardNavItems`) se exportan: el `MobileDrawer` client que
 * se sume después puede reusarlas sin duplicar Tailwind.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

import Link from "next/link"
import { cn } from "@/lib/utils"

export type DashboardRole = "creator" | "admin"

export interface DashboardNavItem {
  label: string
  href: string
}

export interface DashboardShellProps {
  children: React.ReactNode
  userRole: DashboardRole
  userName?: string
  /** Ruta activa para resaltar el item correspondiente (match exacto). */
  activeRoute?: string
  /** Locale usado para construir las rutas por defecto. NO se usa para
   * traducir labels — los labels son strings hardcoded por ahora; cuando
   * se integre con i18n el caller debe armar `navItems` con
   * `useTranslations` y pasarlos. Default `"es"`. */
  pathLocale?: string
  /** Sobreescribir los items por defecto (los del rol). Útil para testing
   * o pantallas que necesiten una nav reducida. */
  navItems?: DashboardNavItem[]
  className?: string
}

const ACCENT_BY_ROLE: Record<
  DashboardRole,
  { border: string; text: string; greeting: string; label: string }
> = {
  creator: {
    border: "border-l-creator",
    text: "text-creator",
    greeting: "text-creator",
    label: "CREATOR",
  },
  admin: {
    border: "border-l-brand",
    text: "text-brand",
    greeting: "text-brand",
    label: "ADMIN",
  },
}

/** Items por defecto por rol. Strings hardcoded en español por ahora —
 * cuando se integre i18n en el PR siguiente, el caller arma esta lista con
 * `useTranslations` y la pasa via prop `navItems`. */
export function defaultDashboardNavItems(
  role: DashboardRole,
  pathLocale: string
): DashboardNavItem[] {
  const base = `/${pathLocale}`
  if (role === "creator") {
    return [
      { label: "Mi panel", href: `${base}/dashboard` },
      { label: "Mis eventos", href: `${base}/dashboard/events` },
      { label: "Mis artistas", href: `${base}/dashboard/artists` },
      { label: "Mi perfil", href: `${base}/dashboard/profile` },
    ]
  }
  return [
    { label: "Aplicaciones", href: `${base}/admin/applications` },
    { label: "Usuarios", href: `${base}/admin/users` },
    { label: "Eventos", href: `${base}/admin/events` },
  ]
}

/** Clases base del item de nav del sidebar. Reusable desde el futuro
 * `MobileDrawer` para mantener el look consistente. */
export const navItemClass =
  "text-body-s rounded-r-m border-l-2 px-m py-s transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"

/** Clases que se suman cuando el item está activo (role-aware via
 * `accent.border` + `accent.text`). */
export const navItemActiveClass = "bg-bg-surface-2 font-semibold"

export default function DashboardShell({
  children,
  userRole,
  userName,
  activeRoute,
  pathLocale = "es",
  navItems,
  className,
}: DashboardShellProps) {
  const accent = ACCENT_BY_ROLE[userRole]
  const items = navItems ?? defaultDashboardNavItems(userRole, pathLocale)
  const greeting = userName ? `Hola, ${userName}` : "Panel"
  const publicHref = `/${pathLocale}`

  return (
    <div className={cn("flex flex-1 min-h-0", className)}>
      {/* Sidebar (desktop). En mobile queda fuera de viewport por ahora —
          la nav inferior + drawer se agregan en el PR de integración. */}
      <aside className="hidden md:flex md:w-[240px] md:flex-col md:border-r md:border-border md:bg-bg-surface md:py-l md:px-m">
        <div className="px-m mb-l">
          <p className={cn("text-eyebrow font-mono mb-xs", accent.greeting)}>
            {accent.label}
          </p>
          <p className="text-body-l font-display font-semibold text-fg-primary">
            {greeting}
          </p>
        </div>

        <nav className="flex flex-col gap-xs">
          {items.map((item) => {
            const isActive = activeRoute === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  navItemClass,
                  isActive
                    ? cn(navItemActiveClass, accent.border, accent.text)
                    : "border-l-transparent text-fg-secondary hover:bg-bg-surface-2 hover:text-fg-primary"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-l">
          <Link
            href={publicHref}
            className="text-caption font-mono text-fg-tertiary hover:text-fg-primary transition-colors"
          >
            ← Volver al sitio público
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-m py-l md:px-l md:py-xl">
        {children}
      </main>
    </div>
  )
}
