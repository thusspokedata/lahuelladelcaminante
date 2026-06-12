/**
 * `/admin/calendar` — gestión de entradas de escena para el calendario.
 *
 * Admin puede ver, agregar y borrar entradas de escena (SceneEvent).
 * La protección de rol viene del layout `(admin)/layout.tsx` via requireRole("admin").
 */
"use client"

import { useState, useEffect, useTransition } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SceneEvent {
  id: string
  date: string
  title: string
  venue: string | null
  externalUrl: string | null
}

export default function AdminCalendarPage() {
  const t = useTranslations("calendar.dashboard")
  const [events, setEvents] = useState<SceneEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [date, setDate] = useState("")
  const [title, setTitle] = useState("")
  const [venue, setVenue] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function loadEvents() {
    setLoading(true)
    try {
      const res = await fetch("/api/dashboard/scene-events")
      if (res.ok) {
        const json = await res.json()
        setEvents(
          json.data.map((e: SceneEvent & { date: string }) => ({
            ...e,
            date: e.date.split("T")[0],
          }))
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await fetch("/api/dashboard/scene-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          title,
          venue: venue || undefined,
          externalUrl: url || undefined,
        }),
      })
      if (res.ok) {
        setDate("")
        setTitle("")
        setVenue("")
        setUrl("")
        await loadEvents()
      } else {
        setError(t("errorMessage"))
      }
    })
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/dashboard/scene-events/${id}`, { method: "DELETE" })
    if (!res.ok) {
      setError(t("errorMessage"))
      return
    }
    await loadEvents()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-fg-primary">{t("title")}</h1>

      {/* Form de creación */}
      <form
        onSubmit={handleAdd}
        className="bg-bg-subtle border border-border rounded-xl p-6 space-y-4"
      >
        <h2 className="text-body-l font-semibold text-fg-primary">{t("addEntry")}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="cal-date">{t("dateLabel")}</Label>
            <Input
              id="cal-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cal-title">{t("titleLabel")}</Label>
            <Input
              id="cal-title"
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cal-venue">{t("venueLabel")}</Label>
            <Input
              id="cal-venue"
              type="text"
              maxLength={200}
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cal-url">{t("urlLabel")}</Label>
            <Input
              id="cal-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div>
        </div>

        {error && <p className="text-body-s text-destructive">{error}</p>}

        <Button type="submit" disabled={isPending}>
          {isPending ? t("saving") : t("addEntry")}
        </Button>
      </form>

      {/* Lista de entradas */}
      {loading ? (
        <p className="text-fg-tertiary text-body">{t("loading")}</p>
      ) : events.length === 0 ? (
        <p className="text-fg-tertiary text-body">{t("empty")}</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-body-s">
            <thead className="bg-bg-subtle border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-fg-secondary font-semibold">
                  {t("dateLabel")}
                </th>
                <th className="text-left px-4 py-3 text-fg-secondary font-semibold">
                  {t("titleLabel")}
                </th>
                <th className="text-left px-4 py-3 text-fg-secondary font-semibold hidden sm:table-cell">
                  {t("venueLabel")}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr
                  key={ev.id}
                  className={cn(
                    "border-b border-border last:border-0",
                    i % 2 === 0 ? "bg-bg-page" : "bg-bg-subtle/30"
                  )}
                >
                  <td className="px-4 py-3 text-fg-secondary font-mono">{ev.date}</td>
                  <td className="px-4 py-3 text-fg-primary font-medium">
                    {ev.title}
                    {ev.externalUrl && (
                      <a
                        href={ev.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-brand text-[11px]"
                      >
                        ↗
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-fg-secondary hidden sm:table-cell">
                    {ev.venue ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="text-[11px] text-fg-tertiary hover:text-destructive transition-colors"
                    >
                      {t("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
