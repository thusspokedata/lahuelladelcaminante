"use client"

/**
 * DashboardMobileTabs — tab bar fija al pie del viewport en mobile (<md).
 * Client por el `usePathname` + porque los iconos vienen como
 * componentes pre-pasados.
 *
 * Acepta items por rol (creator: 4, admin: 3). El color del item activo
 * se tiñe según el rol (`creator` fucsia, `admin` sangre) para mantener
 * coherencia con el sidebar desktop. Se renderiza siempre (no más
 * "creator-only") — admin también necesita navegación mobile.
 */

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type { DashboardRole } from "./shell-constants"

export interface DashboardMobileTabItem {
  /** Label largo para el sidebar desktop (ej. "Mis eventos"). */
  label: string
  /** Label corto para el tab bar mobile (ej. "Eventos"). Suele venir
   * del namespace `dashboard.shell.mobileTabs.*`. */
  shortLabel: string
  /** Href locale-relativo (`/dashboard/events`). */
  href: string
  Icon: React.ComponentType<{ className?: string }>
}

export interface DashboardMobileTabsProps {
  tabs: DashboardMobileTabItem[]
  ariaLabel: string
  /** Rol que define el color del item activo. */
  accent: DashboardRole
}

const ACTIVE_BY_ROLE: Record<DashboardRole, string> = {
  creator: "text-creator",
  admin: "text-brand",
}

const FOCUS_RING_BY_ROLE: Record<DashboardRole, string> = {
  creator: "focus-visible:ring-creator",
  admin: "focus-visible:ring-brand",
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function DashboardMobileTabs({
  tabs,
  ariaLabel,
  accent,
}: DashboardMobileTabsProps) {
  const pathname = usePathname()
  // El grid se ajusta al número de tabs (creator=4, admin=3).
  const colsClass =
    tabs.length === 3 ? "grid-cols-3" : tabs.length === 4 ? "grid-cols-4" : "grid-cols-5"
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "fixed bottom-0 inset-x-0 z-30 md:hidden",
        "bg-bg-page/95 backdrop-blur border-t border-border",
        "px-xs pt-xs pb-[max(env(safe-area-inset-bottom),0.25rem)]"
      )}
    >
      <ul className={cn("grid gap-xs", colsClass)}>
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href)
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-[2px] py-xs rounded-m",
                  "text-caption font-mono uppercase transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2",
                  FOCUS_RING_BY_ROLE[accent],
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
                  active ? ACTIVE_BY_ROLE[accent] : "text-fg-tertiary hover:text-fg-primary"
                )}
              >
                <tab.Icon className="w-5 h-5" aria-hidden />
                <span>{tab.shortLabel}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
