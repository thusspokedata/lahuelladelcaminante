/**
 * Constantes compartidas entre `DashboardShell` (server async) y los
 * sub-componentes client (`DashboardSidebarNav`, `DashboardMobileTabs`).
 * Se viven en un módulo neutro (sin `"use client"` ni `"server-only"`) para
 * que ambos lados puedan importar sin cruzar el boundary RSC en dirección
 * equivocada (client importando de server-only module).
 */

export type DashboardRole = "creator" | "admin"

/** Clases base del item de nav del sidebar. */
export const navItemClass =
  "text-body-s rounded-r-m border-l-2 px-m py-s transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"

/** Clases que se suman cuando el item del sidebar está activo. */
export const navItemActiveClass = "bg-bg-surface-2 font-semibold"
