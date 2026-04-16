"use client"

import Link from "next/link"
import Image from "next/image"
import { useLocale } from "next-intl"
import { formatDate } from "@/lib/utils"
import { MapPin, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EventSummary } from "@/services/events"

const GENRE_COLORS: Record<string, string> = {
  Tango: "bg-rose-700",
  Salsa: "bg-orange-600",
  Cumbia: "bg-amber-600",
  Reggaeton: "bg-violet-600",
  Merengue: "bg-pink-600",
  "Son Cubano": "bg-red-700",
  "Bossa Nova": "bg-emerald-700",
  Vallenato: "bg-sky-700",
  "Flamenco Latino": "bg-orange-700",
  "Latin Jazz": "bg-indigo-700",
}

export function EventCard({ event }: { event: EventSummary }) {
  const locale = useLocale()
  const nextDate = event.dates[0] ? new Date(event.dates[0]) : null
  const genreColor = event.genre ? (GENRE_COLORS[event.genre] ?? "bg-primary") : ""

  return (
    <Link href={`/${locale}/events/${event.slug}`} className="group block h-full">
      <article className="rounded-2xl overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 group-hover:-translate-y-1.5 h-full flex flex-col">

        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          {event.coverImage ? (
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-accent/15 to-primary/10 flex items-center justify-center">
              <span className="text-7xl opacity-15 select-none">🎶</span>
            </div>
          )}

          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Date bubble */}
          {nextDate && (
            <div className="absolute top-3 left-3 bg-white rounded-xl px-2 py-1.5 text-center shadow-lg min-w-[46px]">
              <div className="text-[10px] font-extrabold text-primary uppercase tracking-wider leading-none">
                {nextDate.toLocaleDateString(
                  locale === "es" ? "es-ES" : locale === "de" ? "de-DE" : "en-US",
                  { month: "short" }
                )}
              </div>
              <div className="text-2xl font-black text-foreground leading-none mt-0.5">
                {nextDate.getDate()}
              </div>
            </div>
          )}

          {/* Genre pill */}
          {event.genre && (
            <div className={cn("absolute top-3 right-3 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md", genreColor)}>
              {event.genre}
            </div>
          )}

          {/* Title on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-white text-base leading-snug line-clamp-2 drop-shadow">
              {event.title}
            </h3>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-1.5 flex-1">
          {nextDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5 shrink-0 text-primary/50" />
              <span className="truncate">{formatDate(nextDate, locale)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/50" />
            <span className="truncate">{event.location}</span>
          </div>

          {event.artistName && (
            <div className="mt-auto pt-2.5 border-t border-border/60">
              <span className="text-xs font-bold text-primary uppercase tracking-wide">
                {event.artistName}
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
