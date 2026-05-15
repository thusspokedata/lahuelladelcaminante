/**
 * DashboardShell — layout sidebar + main para el panel del creator y el admin.
 *
 * Sidebar role-aware: el indicador del item activo se tiñe con `creator`
 * (fucsia) para creators y `brand` (sangre) para admins. Es el principal
 * recurso visual que diferencia los dos paneles sin agregar más cromo.
 *
 * En v1 implementamos SOLO la versión desktop (sidebar fija a la izquierda).
 * El comportamiento responsive en mobile (tab bar inferior + drawer
 * accesible desde un hamburger en el header) está pensado y descripto pero
 * se implementa en el PR de integración del dashboard, cuando ya tengamos
 * el contenido real adentro. Por eso este componente es server: no necesita
 * estado para desktop. Cuando se sume el drawer mobile, se va a hacer split
 * (un wrapper server + un `MobileDrawer` client).
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
  /** Locale para construir las rutas. Default `"es"`. */
  locale?: string
  /** Sobreescribir los items por defecto (los del rol). Útil para testing
   * o pantallas que necesiten una nav reducida. Si no se pasa, se usan los
   * items por defecto del rol. */
  navItems?: DashboardNavItem[]
  className?: string
}

const ACCENT_BY_ROLE: Record<
  DashboardRole,
  { border: string; text: string; greeting: string }
> = {
  creator: {
    border: "border-l-creator",
    text: "text-creator",
    greeting: "text-creator",
  },
  admin: {
    border: "border-l-brand",
    text: "text-brand",
    greeting: "text-brand",
  },
}

/** Items por defecto por rol. Hardcodeados en español por ahora — cuando se
 * integre con i18n en el PR siguiente, esto se reemplaza por `useTranslations`
 * en el caller que arme `navItems` y lo pase. */
function defaultNavItems(role: DashboardRole, locale: string): DashboardNavItem[] {
  const base = `/${locale}`
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

export default function DashboardShell({
  children,
  userRole,
  userName,
  activeRoute,
  locale = "es",
  navItems,
  className,
}: DashboardShellProps) {
  const accent = ACCENT_BY_ROLE[userRole]
  const items = navItems ?? defaultNavItems(userRole, locale)
  const greeting = userName ? `Hola, ${userName}` : "Panel"
  const publicHref = `/${locale}`

  return (
    <div className={cn("flex flex-1 min-h-0", className)}>
      {/* Sidebar (desktop). En mobile queda fuera de viewport por ahora —
          la nav inferior + drawer se agregan en el PR de integración. */}
      <aside className="hidden md:flex md:w-[240px] md:flex-col md:border-r md:border-border md:bg-bg-surface md:py-l md:px-m">
        <div className="px-m mb-l">
          <p className={cn("text-eyebrow font-mono mb-xs", accent.greeting)}>
            {userRole === "creator" ? "CREATOR" : "ADMIN"}
          </p>
          <p className="text-body font-display font-semibold text-fg-primary">
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
                  "text-body-s rounded-r-m border-l-2 px-m py-s transition-colors",
                  isActive
                    ? cn("bg-bg-surface-2", accent.border, accent.text, "font-semibold")
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
