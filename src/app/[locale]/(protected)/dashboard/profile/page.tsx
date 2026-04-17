import { getTranslations } from "next-intl/server"
import { requireActive } from "@/services/auth"
import { ProfileForm } from "./ProfileForm"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "dashboard" })
  const { user } = await requireActive(locale)

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <p className="text-xs font-bold text-primary uppercase tracking-[0.15em] mb-1">
          {t("title")}
        </p>
        <h1 className="text-3xl font-black">{t("profile")}</h1>
      </div>

      <ProfileForm
        userId={user.id}
        currentName={user.name}
        currentEmail={user.email}
      />
    </div>
  )
}
