import { requireActive } from "@/services/auth"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

/**
 * Layout del segmento `(protected)`. Solo provee:
 *  - Verificación de auth + estado activo (redirige a /sign-in o /user-pending
 *    si no corresponde).
 *  - Header + Footer comunes.
 *
 * El sidebar / shell del dashboard lo provee `(protected)/dashboard/layout.tsx`
 * via `DashboardShell` (creado en el rediseño del dashboard). No se envuelve
 * children con sidebar acá porque hoy `(protected)` solo contiene `dashboard`
 * y todo el contenido vive bajo ese shell.
 */
export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireActive(locale)

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
