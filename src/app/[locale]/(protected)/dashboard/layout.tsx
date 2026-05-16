/**
 * Layout del dashboard del creator (y admin que tenga contenido propio).
 * Envuelve todo `/dashboard/**` con `DashboardShell` (sidebar desktop +
 * tab bar mobile). El check de auth ya lo hace `(protected)/layout.tsx`
 * arriba; acá solo necesitamos resolver el rol del user para pintar el
 * sidebar con el accent correcto.
 */

import { requireActive } from "@/services/auth"
import DashboardShell from "@/components/dashboard/DashboardShell"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { user } = await requireActive(locale)
  // El dashboard de `/dashboard/**` es siempre creator-themed (fucsia +
  // tab bar mobile), aunque el user logueado sea admin. Los admins pueden
  // crear/editar artistas y eventos como un creator más; el `/admin/**`
  // (PR 12) es el espacio distinto, con shell sangre y sin tab bar mobile.
  return (
    <DashboardShell userRole="creator" userName={user.name} pathLocale={locale}>
      {children}
    </DashboardShell>
  )
}
