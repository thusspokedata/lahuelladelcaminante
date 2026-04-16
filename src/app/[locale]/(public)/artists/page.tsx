import { getTranslations } from "next-intl/server"
import { getAllArtists } from "@/services/artists"
import { ArtistList } from "@/components/artists/ArtistList"

export default async function ArtistsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ search?: string }>
}) {
  const { locale } = await params
  const { search } = await searchParams
  const t = await getTranslations({ locale, namespace: "artists" })
  const artists = await getAllArtists(search)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <form className="flex gap-2">
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder={t("search")}
            className="border rounded-md px-3 py-1.5 text-sm bg-background"
          />
          <button type="submit" className="sr-only">Buscar</button>
        </form>
      </div>
      <ArtistList artists={artists} />
    </div>
  )
}
