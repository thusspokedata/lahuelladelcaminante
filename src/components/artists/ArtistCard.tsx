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

export function ArtistCard({ artist, showsCount }: ArtistCardProps) {
  const firstGenre = artist.genres[0] ?? null
  const chipAccent = genreAccent(firstGenre)
  const fallbackAccent = accentForName(artist.name)

  return (
    <Link
      href={`/artists/${artist.slug}`}
      className={cn(
        "group flex flex-col h-full overflow-hidden rounded-l bg-bg-surface border border-border",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-[2px] hover:border-border-hi",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
      )}
    >
      <div className="relative">
        <FlyerImage
          publicId={artist.coverImagePublicId ?? undefined}
          src={artist.coverImage ?? undefined}
          alt={artist.coverImageAlt ?? artist.name}
          aspectRatio="1:1"
          fallbackInitials={initialsOf(artist.name)}
          fallbackAccent={fallbackAccent}
        />

        {showsCount && showsCount > 0 ? (
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
        ) : null}
      </div>

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
    </Link>
  )
}

function initialsOf(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return name.slice(0, 2).toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default ArtistCard
