/**
 * SocialLinks — bloque de enlaces a redes sociales de un artista. Recibe el
 * JSON `Artist.socialMedia` (campo flexible donde cada key es la plataforma
 * y el value la URL completa) y renderiza un botón por cada plataforma que
 * tenga URL no vacía. Las plataformas sin URL se omiten — la lista no
 * "cuela" vacíos.
 *
 * No usa nombres como labels visibles (Instagram, Spotify, etc) son brand
 * names — no se traducen. Los iconos vienen de lucide-react para las
 * comunes; para plataformas raras o sin icono específico usamos el genérico
 * `ExternalLink`.
 */

import { ExternalLink, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Whitelist de plataformas para resolver el label visible. Solo el "website"
 * usa un icono distinto (`Globe`) para diferenciarlo visualmente como
 * "el sitio propio del artista" frente a "una red social externa". Todas
 * las redes usan `ExternalLink` — uniforme + honesto ("te llevamos
 * afuera").
 *
 * TODO: cuando lucide-react actualice a v1.10+ o se decida sumar
 * `simple-icons`, cambiar a iconos de marca por plataforma.
 */
const PLATFORM_META: Record<
  string,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  instagram: { label: "Instagram", Icon: ExternalLink },
  youtube: { label: "YouTube", Icon: ExternalLink },
  spotify: { label: "Spotify", Icon: ExternalLink },
  bandcamp: { label: "Bandcamp", Icon: ExternalLink },
  soundcloud: { label: "SoundCloud", Icon: ExternalLink },
  tiktok: { label: "TikTok", Icon: ExternalLink },
  facebook: { label: "Facebook", Icon: ExternalLink },
  website: { label: "Web", Icon: Globe },
}

export interface SocialLinksProps {
  /** El JSON `Artist.socialMedia` directo. Espera shape `Record<string, string>`. */
  socialMedia: unknown
  className?: string
}

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function SocialLinks({ socialMedia, className }: SocialLinksProps) {
  if (!isStringRecord(socialMedia)) return null

  const entries = Object.entries(socialMedia).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].trim() !== ""
  )

  if (entries.length === 0) return null

  return (
    <ul className={cn("flex flex-wrap gap-s", className)}>
      {entries.map(([key, url]) => {
        const meta = PLATFORM_META[key.toLowerCase()]
        const label = meta?.label ?? capitalize(key)
        const Icon = meta?.Icon ?? ExternalLink
        return (
          <li key={key}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-xs px-m py-s rounded-pill border border-border bg-bg-surface text-fg-primary text-body-s font-medium transition-colors duration-200 ease-out hover:border-border-hi hover:bg-bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
