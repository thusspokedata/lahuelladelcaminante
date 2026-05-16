"use client"

/**
 * DashboardMobileTabs — tab bar fija al pie del viewport en mobile (<md).
 * Client por el `usePathname` y por el map `iconKey → componente`.
 *
 * Acepta items por rol (creator: 4, admin: 3). El color del item activo
 * se tiñe según el rol (`creator` fucsia, `admin` sangre) para mantener
 * coherencia con el sidebar desktop.
 *
 * **Iconos por key serializable**: el server pasa `iconKey: "home"`,
 * etc., y este cliente mapea a su componente Lucide. Pasar referencias
 * a componentes server→client funciona técnicamente en RSC pero rompe
 * la metáfora de "props serializables" y bloquea optimizaciones de
 * tree-shake del bundle. La key string es la forma idiomática.
 */

import type { ComponentType, SVGProps } from "react"
import { Link, usePathname } from "@/i18n/navigation"
import { Home, Calendar, Users, User, ClipboardList, UserCog } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DashboardRole } from "./shell-constants"

/** Whitelist de iconos disponibles para los tabs. Agregar acá si hace
 * falta uno nuevo (Lucide v1.8 disponible). */
export type DashboardTabIconKey =
  | "home"
  | "calendar"
  | "users"
  | "user"
  | "clipboardList"
  | "userCog"

const ICON_BY_KEY: Record<
  DashboardTabIconKey,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  home: Home,
  calendar: Calendar,
  users: Users,
  user: User,
  clipboardList: ClipboardList,
  userCog: UserCog,
}

export interface DashboardMobileTabItem {
  /** Label largo para el sidebar desktop (ej. "Mis eventos"). */
  label: string
  /** Label corto para el tab bar mobile (ej. "Eventos"). */
  shortLabel: string
  /** Href locale-relativo (`/dashboard/events`). */
  href: string
  /** Key serializable del icono. Mapeada a componente acá adentro. */
  iconKey: DashboardTabIconKey
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
          const Icon = ICON_BY_KEY[tab.iconKey]
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
                <Icon className="w-5 h-5" aria-hidden />
                <span>{tab.shortLabel}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
