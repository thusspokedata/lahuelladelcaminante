/**
 * ArtistCard — card cuadrada (1:1) del artista.
 *
 * Composición:
 *  - Portrait 1:1 con `FlyerImage`. Si no hay foto, el componente cae a
 *    fallback de iniciales gigantes sobre gradient teñido (estilo
 *    "MS / WP / FC" del handoff §1.4). El accent del fallback es
 *    estable por hash del nombre, así cada artista tiene "su color".
 *  - Badge "X shows" opcional como overlay bottom-left (si `showsCount`
 *    se pasa y es > 0).
 *  - Info debajo: nombre + origen + Chip del primer género.
 *
 * Server component. Link envolvente al perfil del artista.
 * Hover → lift 2px + brillo del borde, transición 200ms ease-out.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §3 + §4.1.
 */

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { genreAccent } from "@/lib/genre-accent"
import type { ArtistSummary } from "@/services/artists"
import type { AccentBound } from "@/components/types"
import Chip from "@/components/ui/Chip"
import FlyerImage from "@/components/ui/FlyerImage"

export interface ArtistCardProps {
  artist: ArtistSummary
  /** Si está y es > 0, muestra el badge "X shows". */
  showsCount?: number
  /**
   * Variante dashboard del creator/admin: el card sigue siendo link al
   * perfil público, pero acepta un slot `actions` (overlay sobre la foto)
   * con acciones admin (Editar / Borrar / Ver público).
   */
  dashboard?: boolean
  /**
   * Slot de acciones admin renderizado sobre el portrait. Solo se muestra
   * si `dashboard` es `true`. Típicamente un `<ArtistCardActions>` client
   * con dropdown.
   */
  actions?: React.ReactNode
}

const FALLBACK_ACCENTS: readonly AccentBound[] = ["brand", "editorial", "creator"]

/** Hash determinístico de un string → índice de FALLBACK_ACCENTS. Hace que
 * un mismo nombre siempre caiga en el mismo color, sin estado en DB. */
function accentForName(name: string): AccentBound {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0
  }
  return FALLBACK_ACCENTS[Math.abs(h) % FALLBACK_ACCENTS.length]!
}

export function ArtistCard({
  artist,
  showsCount,
  dashboard = false,
  actions,
}: ArtistCardProps) {
  const firstGenre = artist.genres[0] ?? null
  const chipAccent = genreAccent(firstGenre)
  const fallbackAccent = accentForName(artist.name)

  const containerClass = cn(
    "group flex flex-col h-full overflow-hidden rounded-l bg-bg-surface border border-border",
    "transition-all duration-200 ease-out",
    "hover:-translate-y-[2px] hover:border-border-hi",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
  )

  // Las iniciales del fallback se derivan del `alt` (que ya es el
  // nombre del artista cuando no hay `coverImageAlt`). No duplicamos
  // la lógica de iniciales en este componente — FlyerImage la
  // resuelve via su helper interno `deriveInitials`.
  const portrait = (
    <FlyerImage
      publicId={artist.coverImagePublicId ?? undefined}
      src={artist.coverImage ?? undefined}
      alt={artist.coverImageAlt ?? artist.name}
      aspectRatio="1:1"
      fallbackAccent={fallbackAccent}
    />
  )

  const showsBadge =
    showsCount && showsCount > 0 ? (
      <div className="absolute bottom-m left-m">
        <span
          className={cn(
            "inline-flex items-center gap-xs rounded-pill",
            "bg-bg-page/85 backdrop-blur-sm border border-border",
            "px-s py-[2px] text-caption font-mono text-fg-primary"
          )}
        >
          <span
            aria-hidden="true"
            className="w-[6px] h-[6px] rounded-pill bg-brand"
          />
          {showsCount}
        </span>
      </div>
    ) : null

  const meta = (
    <div className="flex flex-col gap-xs p-m flex-1">
      <h3 className="text-heading-s font-display text-fg-primary line-clamp-1">
        {artist.name}
      </h3>
      {artist.origin ? (
        <p className="text-body-s text-fg-secondary line-clamp-1">
          {artist.origin}
        </p>
      ) : null}
      {firstGenre ? (
        <div className="mt-auto pt-s">
          <Chip accent={chipAccent} active size="s">
            {firstGenre}
          </Chip>
        </div>
      ) : null}
    </div>
  )

  // Variante dashboard: el card no es un `<Link>` envolvente (las acciones
  // admin chocan con anchor anidado). El nombre dentro del meta es link al
  // perfil público; el slot `actions` se renderiza como overlay sobre el
  // portrait (visible siempre en mobile, en hover/focus en desktop).
  if (dashboard) {
    return (
      <article className={containerClass}>
        <div className="relative">
          {portrait}
          {showsBadge}
          {actions ? (
            <div
              className={cn(
                "absolute top-m right-m",
                "md:opacity-0 md:transition-opacity md:duration-200",
                "md:group-hover:opacity-100 md:group-focus-within:opacity-100"
              )}
            >
              {actions}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-xs p-m flex-1">
          <Link
            href={`/artists/${artist.slug}`}
            className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-creator focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page rounded-xs"
          >
            <h3 className="text-heading-s font-display text-fg-primary line-clamp-1">
              {artist.name}
            </h3>
          </Link>
          {artist.origin ? (
            <p className="text-body-s text-fg-secondary line-clamp-1">
              {artist.origin}
            </p>
          ) : null}
          {firstGenre ? (
            <div className="mt-auto pt-s">
              <Chip accent={chipAccent} active size="s">
                {firstGenre}
              </Chip>
            </div>
          ) : null}
        </div>
      </article>
    )
  }

  return (
    <Link href={`/artists/${artist.slug}`} className={containerClass}>
      <div className="relative">
        {portrait}
        {showsBadge}
      </div>
      {meta}
    </Link>
  )
}

