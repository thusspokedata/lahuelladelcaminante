import { getTranslations } from "next-intl/server"
import { getAllUsers } from "@/services/users"
import { UserTable } from "@/components/dashboard/UserTable"

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin" })
  const users = await getAllUsers()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("users")}</h1>
      <UserTable users={users} />
    </div>
  )
}
