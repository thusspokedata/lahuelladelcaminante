import { requireRole } from "@/services/auth"
import { DashboardNav } from "@/components/dashboard/DashboardNav"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await requireRole("admin", locale)

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 flex gap-8 flex-1">
        <aside className="w-48 flex-shrink-0">
          <DashboardNav role={user.role ?? "admin"} />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <Footer />
    </>
  )
}
