import { requireActive } from "@/services/auth"
import { DashboardNav } from "@/components/dashboard/DashboardNav"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { user } = await requireActive(locale)

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-8 flex-1">
        <aside className="w-52 flex-shrink-0 hidden md:block">
          <DashboardNav role={user.role ?? "user"} />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <Footer />
    </>
  )
}
