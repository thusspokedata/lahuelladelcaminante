"use client"

/**
 * DashboardMobileTabs — tab bar fija al pie del viewport en mobile (<md).
 * Client por el `usePathname` + porque los iconos vienen como
 * componentes pre-pasados.
 *
 * Solo se renderiza para el creator (admin queda solo desktop por ahora —
 * el padre `DashboardShell` decide cuándo montar este componente).
 */

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

export interface DashboardMobileTabItem {
  label: string
  /** Href locale-relativo (`/dashboard/events`). */
  href: string
  Icon: React.ComponentType<{ className?: string }>
}

export interface DashboardMobileTabsProps {
  tabs: DashboardMobileTabItem[]
  ariaLabel: string
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function DashboardMobileTabs({
  tabs,
  ariaLabel,
}: DashboardMobileTabsProps) {
  const pathname = usePathname()
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "fixed bottom-0 inset-x-0 z-30 md:hidden",
        "bg-bg-page/95 backdrop-blur border-t border-border",
        "px-xs pt-xs pb-[max(env(safe-area-inset-bottom),0.25rem)]"
      )}
    >
      <ul className="grid grid-cols-4 gap-xs">
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
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-creator",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
                  active
                    ? "text-creator"
                    : "text-fg-tertiary hover:text-fg-primary"
                )}
              >
                <tab.Icon className="w-5 h-5" aria-hidden />
                <span>{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
