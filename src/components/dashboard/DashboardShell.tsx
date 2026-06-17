/**
 * DashboardShell — layout sidebar + main para el panel del creator y el admin.
 *
 * Sidebar role-aware: el indicador del item activo se tiñe con `creator`
 * (fucsia) para creators y `brand` (sangre) para admins. Es el principal
 * recurso visual que diferencia los dos paneles sin agregar más cromo.
 *
 * En desktop (`md:` arriba): sidebar fija 240px a la izquierda + main.
 * En mobile (debajo de `md`): tab bar fija al pie del viewport con los
 * items del role. Sidebar y tab bar derivan de la misma fuente
 * (`getDashboardNavItems`) para evitar drift — si se agrega un item al
 * sidebar, aparece también en mobile sin tocar dos lugares.
 *
 * Highlight de active route lo derivan sub-componentes client
 * (`DashboardSidebarNav` y `DashboardMobileTabs`) usando `usePathname`,
 * para que el shell siga siendo server async sin middleware extra.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.1.
 */

import { Link } from "@/i18n/navigation"
import { getTranslations } from "next-intl/server"
import { cn } from "@/lib/utils"
import DashboardSidebarNav, {
  type DashboardSidebarNavItem,
} from "./DashboardSidebarNav"
import DashboardMobileTabs, {
  type DashboardMobileTabItem,
} from "./DashboardMobileTabs"
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

/**
 * Fuente única de los items de navegación por rol. El sidebar desktop
 * usa `label + href`; el tab bar mobile suma `Icon` (mismas claves). Si
 * el sidebar y el tab bar tuvieran fuentes separadas, agregar un item en
 * uno y olvidar el otro generaría drift silencioso entre los dos
 * viewports.
 *
 * Los labels del sidebar usan el namespace `dashboard.shell.nav.<role>.*`
 * (formato largo: "Mis eventos"); los del mobile usan
 * `dashboard.shell.mobileTabs.*` (formato corto: "Eventos") porque en
 * mobile el espacio horizontal pide compactación.
 */
async function getDashboardNavItems(
  role: DashboardRole,
  pathLocale: string
): Promise<DashboardMobileTabItem[]> {
  const tSidebar = await getTranslations({
    locale: pathLocale,
    namespace: "dashboard.shell.nav",
  })
  const tMobile = await getTranslations({
    locale: pathLocale,
    namespace: "dashboard.shell.mobileTabs",
  })

  if (role === "creator") {
    return [
      { label: tSidebar("creator.dashboard"), shortLabel: tMobile("dashboard"), href: "/dashboard", iconKey: "home" },
      { label: tSidebar("creator.events"), shortLabel: tMobile("events"), href: "/dashboard/events", iconKey: "calendar" },
      { label: tSidebar("creator.artists"), shortLabel: tMobile("artists"), href: "/dashboard/artists", iconKey: "users" },
      { label: tSidebar("creator.profile"), shortLabel: tMobile("profile"), href: "/dashboard/profile", iconKey: "user" },
    ]
  }

  // Admin no tiene `profile` separado (no existe /admin/profile). El
  // shortLabel cae al `label` largo para mantener la simetría — el tab
  // bar mobile admin acepta strings un poco más largos porque son 3 (no 4).
  return [
    {
      label: tSidebar("admin.applications"),
      shortLabel: tSidebar("admin.applications"),
      href: "/admin/applications",
      iconKey: "clipboardList",
    },
    {
      label: tSidebar("admin.users"),
      shortLabel: tSidebar("admin.users"),
      href: "/admin/users",
      iconKey: "userCog",
    },
    {
      label: tSidebar("admin.events"),
      shortLabel: tSidebar("admin.events"),
      href: "/admin/events",
      iconKey: "calendar",
    },
    {
      label: tSidebar("admin.calendar"),
      shortLabel: tSidebar("admin.calendar"),
      href: "/admin/calendar",
      iconKey: "calendarDays",
    },
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

  const navItems = await getDashboardNavItems(userRole, pathLocale)

  // El sidebar acepta items sin `Icon` ni `shortLabel`. Si el caller
  // pasa `sidebarItems` (override de testing/pantalla acotada), gana.
  const sidebar: DashboardSidebarNavItem[] =
    sidebarItems ?? navItems.map(({ label, href }) => ({ label, href }))

  const greeting = userName
    ? tShell("greeting", { name: userName })
    : tShell("greetingFallback")
  const roleLabel = tShell(`role.${accent.labelKey}`)
  const backLabel = tShell("backToPublic")
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
          items={sidebar}
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
          "pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-xl"
        )}
      >
        {children}
      </main>

      {/* Tab bar mobile: ambos roles ahora. Antes era creator-only;
          se unificó tras el feedback de CR — admin también necesita
          poder navegar en mobile, y derivar de la misma fuente
          (`navItems`) que el sidebar evita drift. */}
      <DashboardMobileTabs
        tabs={navItems}
        ariaLabel={mobileTabsAriaLabel}
        accent={userRole}
      />
    </div>
  )
}
