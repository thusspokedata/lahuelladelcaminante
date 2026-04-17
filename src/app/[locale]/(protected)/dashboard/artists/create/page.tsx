import { getTranslations } from "next-intl/server"
import { requireRole } from "@/services/auth"
import { ArtistForm } from "@/components/artists/ArtistForm"

export default async function CreateArtistPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireRole("ARTIST", locale)
  const tForms = await getTranslations({ locale, namespace: "forms" })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{tForms("createArtist")}</h1>
      <ArtistForm />
    </div>
  )
}
