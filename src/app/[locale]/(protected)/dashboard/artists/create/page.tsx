import { getTranslations } from "next-intl/server"
import { requireRole } from "@/services/auth"
import { ArtistForm } from "@/components/artists/ArtistForm"
import Eyebrow from "@/components/ui/Eyebrow"

export default async function CreateArtistPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireRole("creator", locale)
  const t = await getTranslations({ locale, namespace: "artistForm.create" })

  return (
    <div className="flex flex-col gap-xl">
      <header className="flex flex-col gap-xs">
        <Eyebrow accent="brand">{t("eyebrow")}</Eyebrow>
        <h1 className="text-display-m font-display text-fg-primary leading-tight">
          {t("title")}
        </h1>
      </header>
      <ArtistForm />
    </div>
  )
}
