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
    <div>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.18em] mb-1.5">
            Música latina · Berlín
          </p>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h1 className="text-4xl font-black">{t("title")}</h1>
            <form className="flex gap-2">
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder={t("search")}
                className="border border-border rounded-full px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors w-56"
              />
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <ArtistList artists={artists} />
      </div>
    </div>
  )
}
