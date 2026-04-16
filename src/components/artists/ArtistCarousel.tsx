"use client"

import { useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLocale } from "next-intl"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ArtistSummary } from "@/services/artists"

interface ArtistCarouselProps {
  artists: ArtistSummary[]
  variant?: "upcoming" | "past"
}

export function ArtistCarousel({ artists, variant = "upcoming" }: ArtistCarouselProps) {
  const locale = useLocale()
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.75
    scrollRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" })
  }

  if (artists.length === 0) return null

  return (
    <div className="relative group/carousel">
      {/* Left button */}
      <button
        onClick={() => scroll("left")}
        aria-label="Anterior"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-accent"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {artists.map((artist) => (
          <Link
            key={artist.id}
            href={`/${locale}/artists/${artist.slug}`}
            className="group/card shrink-0 w-44 sm:w-52"
            style={{ scrollSnapAlign: "start" }}
          >
            <div className={cn(
              "relative w-full aspect-square rounded-2xl overflow-hidden mb-3",
              variant === "past" && "grayscale group-hover/card:grayscale-0 transition-all duration-500"
            )}>
              {artist.coverImage ? (
                <Image
                  src={artist.coverImage}
                  alt={artist.name}
                  fill
                  sizes="208px"
                  className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center">
                  <span className="text-5xl opacity-20 select-none">🎵</span>
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
            </div>

            <div className="px-1">
              <p className="font-bold text-sm leading-snug line-clamp-1 group-hover/card:text-primary transition-colors">
                {artist.name}
              </p>
              {artist.origin && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{artist.origin}</p>
              )}
              {artist.genres.length > 0 && (
                <p className="text-xs text-primary/70 mt-0.5 font-medium line-clamp-1">
                  {artist.genres[0]}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Right button */}
      <button
        onClick={() => scroll("right")}
        aria-label="Siguiente"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-accent"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
