/**
 * Layout del dashboard del creator (y admin que tenga contenido propio).
 * Envuelve todo `/dashboard/**` con `DashboardShell` (sidebar desktop +
 * tab bar mobile). El check de auth ya lo hace `(protected)/layout.tsx`
 * arriba; acá resolvemos el rol para decidir qué renderizar.
 *
 * Modelo de cuenta (`feat/public-signup-creator-flow`): un `role: user`
 * autenticado es legítimo — navega el sitio público — pero NO accede al
 * panel creator. Cuando intenta entrar a `/dashboard/**`, en lugar de un
 * redirect abrupto ve la pantalla intermedia `CreatorGate` (con 3
 * sub-estados según su `Application`: nunca aplicó / esperando / rechazado).
 *
 * `CreatorGate` se renderiza acá en el LAYOUT — no en `page.tsx` — para
 * que cubra todo `/dashboard/**` (events, artists, profile, create…) con
 * un solo punto de decisión. Un `user` no-creator que escriba a mano
 * `/dashboard/events/create` ve el gate, no el shell de creator.
 */

import { requireActive, isCreatorOrAdmin } from "@/services/auth"
import DashboardShell from "@/components/dashboard/DashboardShell"
import CreatorGate from "@/components/dashboard/CreatorGate"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { user } = await requireActive(locale)

  // Un `role: user` no es creator todavía → pantalla intermedia en vez
  // del shell. `children` (los page.tsx de las sub-rutas) no se renderiza.
  if (!isCreatorOrAdmin(user.role)) {
    return <CreatorGate locale={locale} userEmail={user.email} />
  }

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
