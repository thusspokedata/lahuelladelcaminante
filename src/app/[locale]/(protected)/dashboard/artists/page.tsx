/**
 * `/dashboard/artists` — listado de artistas del creator/admin.
 *
 * Grid de `ArtistCard` en modo dashboard (overlay con acción "Editar" en
 * hover/focus desktop, visible siempre en mobile). Estado vacío con CTA
 * "Crear tu primer artista". Permiso: solo creator+admin (igual que la
 * versión previa al rediseño).
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §4.
 */

import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { requireActive } from "@/services/auth"
import { getArtistsByUser } from "@/services/artists"
import Eyebrow from "@/components/ui/Eyebrow"
import { ArtistCard } from "@/components/artists/ArtistCard"

export default async function DashboardArtistsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { user } = await requireActive(locale)
  // Role check ya lo hace `(protected)/dashboard/layout.tsx`: si no es
  // creator/admin no llega acá. No repetimos el guard.

  const t = await getTranslations({ locale, namespace: "dashboard" })
  const artists = await getArtistsByUser(user.id)
  const tActions = await getTranslations({
    locale,
    namespace: "dashboard.artists.card.actions",
  })

  return (
    <div className="flex flex-col gap-l">
      <header className="flex flex-col gap-s sm:flex-row sm:items-end sm:justify-between sm:gap-m">
        <div className="flex flex-col gap-xs">
          <Eyebrow accent="creator">{t("artists.eyebrow")}</Eyebrow>
          <h1 className="text-display-m font-display text-fg-primary">
            {t("artists.title")}
          </h1>
          <p className="text-body-s text-fg-secondary">
            {artists.length} {t("artists.count")}
          </p>
        </div>
        <Link
          href="/dashboard/artists/create"
          className="inline-flex items-center justify-center self-start sm:self-end rounded-pill bg-creator text-on-creator font-semibold px-l py-s text-body-s hover:bg-creator/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-creator focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
        >
          {t("artists.action.new")}
        </Link>
      </header>

      {artists.length === 0 ? (
        <div className="flex flex-col items-start gap-m rounded-l border border-dashed border-border bg-bg-surface px-l py-2xl">
          <p className="text-body text-fg-secondary">{t("artists.empty")}</p>
          <Link
            href="/dashboard/artists/create"
            className="inline-flex items-center justify-center rounded-pill bg-creator text-on-creator font-semibold px-l py-s text-body-s hover:bg-creator/85 transition-colors"
          >
            {t("artists.emptyCta")}
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-m">
          {artists.map((artist) => (
            <li key={artist.id}>
              <ArtistCard
                artist={artist}
                dashboard
                actions={
                  <Link
                    href={`/dashboard/artists/${artist.id}/edit`}
                    className="inline-flex items-center justify-center rounded-pill bg-bg-page/85 backdrop-blur border border-border px-m py-xs text-body-s font-semibold text-fg-primary hover:bg-bg-page transition-colors"
                  >
                    {tActions("edit")}
                  </Link>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
