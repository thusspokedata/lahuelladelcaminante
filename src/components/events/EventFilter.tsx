"use client"

import { useTranslations } from "next-intl"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const GENRES = [
  "Tango", "Salsa", "Cumbia", "Reggaeton", "Merengue",
  "Son Cubano", "Bossa Nova", "Vallenato", "Flamenco Latino", "Latin Jazz",
]

export function EventFilter() {
  const t = useTranslations("events")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get("genre") ?? ""

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all" && value !== null) {
      params.set("genre", value)
    } else {
      params.delete("genre")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{t("filterByGenre")}:</span>
      <Select value={current || "all"} onValueChange={handleChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allGenres")}</SelectItem>
          {GENRES.map((genre) => (
            <SelectItem key={genre} value={genre}>
              {genre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
