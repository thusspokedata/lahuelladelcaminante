import { getTranslations } from "next-intl/server"
import { requireActive, isArtistOrAdmin } from "@/services/auth"
import { getArtistsByUser } from "@/services/artists"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardArtistsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "dashboard" })
  const { user } = await requireActive(locale)

  if (!isArtistOrAdmin(user.role)) {
    return <p className="text-muted-foreground">No tienes permisos de artista.</p>
  }

  const artists = await getArtistsByUser(user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("myArtists")}</h1>
        <Button asChild size="sm">
          <Link href={`/${locale}/dashboard/artists/create`}>+ Crear Artista</Link>
        </Button>
      </div>

      {artists.length === 0 ? (
        <p className="text-muted-foreground">No tienes artistas aún.</p>
      ) : (
        <div className="space-y-2">
          {artists.map((artist) => (
            <div key={artist.id} className="flex items-center justify-between border rounded-lg px-4 py-3 bg-card">
              <div>
                <p className="font-medium">{artist.name}</p>
                <p className="text-sm text-muted-foreground">
                  {artist.origin} · {artist.genres.join(", ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${locale}/artists/${artist.slug}`}>Ver</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${locale}/dashboard/artists/${artist.id}/edit`}>Editar</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
