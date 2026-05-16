/**
 * DashboardShell — layout sidebar + main para el panel del creator y el admin.
 *
 * Sidebar role-aware: el indicador del item activo se tiñe con `creator`
 * (fucsia) para creators y `brand` (sangre) para admins. Es el principal
 * recurso visual que diferencia los dos paneles sin agregar más cromo.
 *
 * En desktop (`md:` arriba): sidebar fija 240px a la izquierda + main.
 * En mobile (debajo de `md`): tab bar fija al pie del viewport con 4
 * items para creator (admin no tiene tab bar mobile por ahora). Los items
 * del sidebar y del tab bar derivan el highlight del path actual via
 * `usePathname` (sub-componentes client `DashboardSidebarNav` y
 * `DashboardMobileTabs`).
 *
 * Server async — consume `getTranslations` para los labels. Si el caller
 * necesita un set de items distinto al default (testing, una pantalla
 * acotada), puede pasar `sidebarItems`.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { Home, Calendar, Users, User } from "lucide-react"
import { cn } from "@/lib/utils"
import DashboardSidebarNav, {
  type DashboardSidebarNavItem,
} from "./DashboardSidebarNav"
import DashboardMobileTabs from "./DashboardMobileTabs"
import type { DashboardRole } from "./shell-constants"

export type { DashboardRole } from "./shell-constants"

export interface DashboardShellProps {
  children: React.ReactNode
  userRole: DashboardRole
  userName?: string
  /** Locale del request — usado para `getTranslations`. */
  pathLocale: string
  /** Sobreescribir los items por defecto del sidebar. Útil para testing. */
  sidebarItems?: DashboardSidebarNavItem[]
  className?: string
}

const ACCENT_BY_ROLE: Record<
  DashboardRole,
  { border: string; text: string; greeting: string; labelKey: "creator" | "admin" }
> = {
  creator: {
    border: "border-l-creator",
    text: "text-creator",
    greeting: "text-creator",
    labelKey: "creator",
  },
  admin: {
    border: "border-l-brand",
    text: "text-brand",
    greeting: "text-brand",
    labelKey: "admin",
  },
}

// `navItemClass` y `navItemActiveClass` ahora viven en `shell-constants.ts`
// (módulo neutro, sin "use client" ni "server-only") para que el sidebar nav
// client las pueda importar sin cruzar boundary RSC.

async function getDefaultSidebarItems(
  role: DashboardRole,
  pathLocale: string
): Promise<DashboardSidebarNavItem[]> {
  const t = await getTranslations({
    locale: pathLocale,
    namespace: "dashboard.shell.nav",
  })
  if (role === "creator") {
    return [
      { label: t("creator.dashboard"), href: "/dashboard" },
      { label: t("creator.events"), href: "/dashboard/events" },
      { label: t("creator.artists"), href: "/dashboard/artists" },
      { label: t("creator.profile"), href: "/dashboard/profile" },
    ]
  }
  return [
    { label: t("admin.applications"), href: "/admin/applications" },
    { label: t("admin.users"), href: "/admin/users" },
    { label: t("admin.events"), href: "/admin/events" },
  ]
}

async function getCreatorMobileTabs(pathLocale: string) {
  const t = await getTranslations({
    locale: pathLocale,
    namespace: "dashboard.shell.mobileTabs",
  })
  return [
    { label: t("dashboard"), href: "/dashboard", Icon: Home },
    { label: t("events"), href: "/dashboard/events", Icon: Calendar },
    { label: t("artists"), href: "/dashboard/artists", Icon: Users },
    { label: t("profile"), href: "/dashboard/profile", Icon: User },
  ]
}

export default async function DashboardShell({
  children,
  userRole,
  userName,
  pathLocale,
  sidebarItems,
  className,
}: DashboardShellProps) {
  const accent = ACCENT_BY_ROLE[userRole]
  const tShell = await getTranslations({
    locale: pathLocale,
    namespace: "dashboard.shell",
  })
  const items =
    sidebarItems ?? (await getDefaultSidebarItems(userRole, pathLocale))
  const greeting = userName
    ? tShell("greeting", { name: userName })
    : tShell("greetingFallback")
  const roleLabel = tShell(`role.${accent.labelKey}`)
  const backLabel = tShell("backToPublic")

  const showMobileTabs = userRole === "creator"
  const mobileTabs = showMobileTabs ? await getCreatorMobileTabs(pathLocale) : []
  const mobileTabsAriaLabel = tShell("mobileTabs.ariaLabel")

  return (
    <div className={cn("flex flex-1 min-h-0", className)}>
      {/* Sidebar desktop. */}
      <aside className="hidden md:flex md:w-[240px] md:flex-col md:border-r md:border-border md:bg-bg-surface md:py-l md:px-m">
        <div className="px-m mb-l">
          <p className={cn("text-eyebrow font-mono mb-xs", accent.greeting)}>
            {roleLabel}
          </p>
          <p className="text-body-l font-display font-semibold text-fg-primary">
            {greeting}
          </p>
        </div>

        <DashboardSidebarNav
          items={items}
          accentBorderClass={accent.border}
          accentTextClass={accent.text}
          role={userRole}
        />

        <div className="mt-auto pt-l">
          <Link
            href="/"
            className="text-caption font-mono text-fg-tertiary hover:text-fg-primary transition-colors"
          >
            {backLabel}
          </Link>
        </div>
      </aside>

      {/* Main. En mobile dejamos espacio para el tab bar fijo (h≈64px
          + safe-area inset bottom). En desktop no hace falta. */}
      <main
        className={cn(
          "flex-1 min-w-0 px-m py-l md:px-l md:py-xl",
          showMobileTabs &&
            "pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-xl"
        )}
      >
        {children}
      </main>

      {showMobileTabs ? (
        <DashboardMobileTabs
          tabs={mobileTabs}
          ariaLabel={mobileTabsAriaLabel}
        />
      ) : null}
    </div>
  )
}
