"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface EventFilterProps {
  genres: string[]
  cities: string[]
}

export function EventFilter({ genres, cities }: EventFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentGenre = searchParams.get("genre") ?? ""
  const currentCity = searchParams.get("city") ?? ""

  function update(key: "genre" | "city", value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Genre pills */}
      {genres.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => update("genre", "")}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
              currentGenre === ""
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            )}
          >
            Todos
          </button>
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => update("genre", genre)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                currentGenre === genre
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* City pills */}
      {cities.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => update("city", "")}
            className={cn(
              "shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap border",
              currentCity === ""
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            )}
          >
            Todas las ciudades
          </button>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => update("city", city)}
              className={cn(
                "shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap border",
                currentCity === city
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
              )}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
