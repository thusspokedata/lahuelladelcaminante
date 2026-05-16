"use client"

/**
 * DashboardSidebarNav — lista interactiva de links del sidebar del
 * `DashboardShell`. Client por necesidad: usa `usePathname` para resaltar
 * el item activo sin que el caller tenga que computar la ruta.
 *
 * Recibe items ya traducidos (label + href sin prefijo de locale, p.ej.
 * `/dashboard/events`). El highlight matchea con prefix (ej. estando en
 * `/dashboard/events/123/edit` el item "Eventos" se mantiene activo).
 *
 * Las clases vienen del shell para mantener consistencia visual con el
 * tab bar mobile y con el item idle/activo.
 */

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import {
  navItemClass,
  navItemActiveClass,
  type DashboardRole,
} from "./shell-constants"

export interface DashboardSidebarNavItem {
  label: string
  /** Href locale-relativo (`/dashboard`, no `/es/dashboard`). */
  href: string
}

export interface DashboardSidebarNavProps {
  items: DashboardSidebarNavItem[]
  /** Borde y color del item activo (creator vs admin). */
  accentBorderClass: string
  accentTextClass: string
  /** Rol — solo se usa para data attribute de testing/debug. */
  role: DashboardRole
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function DashboardSidebarNav({
  items,
  accentBorderClass,
  accentTextClass,
  role,
}: DashboardSidebarNavProps) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-xs" data-role={role}>
      {items.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              navItemClass,
              active
                ? cn(navItemActiveClass, accentBorderClass, accentTextClass)
                : "border-l-transparent text-fg-secondary hover:bg-bg-surface-2 hover:text-fg-primary"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
