"use client"

/**
 * EventsCalendar — grilla mensual interactiva.
 *
 * Recibe los datos del mes actual del Server Component padre y maneja
 * navegación mes a mes via fetch a /api/calendar?month=YYYY-MM.
 *
 * La grilla siempre empieza en Lunes (semana europea).
 */

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import CalendarDayCell from "./CalendarDayCell"
import CalendarEventPopup from "./CalendarEventPopup"
import type { CalendarEntry } from "@/services/calendar"

interface EventsCalendarProps {
  initialEntries: CalendarEntry[]
  initialMonth: string // "YYYY-MM"
  locale: string
}

interface PopupState {
  entry: CalendarEntry
  anchorRect: DOMRect | null
}

/** Retorna "YYYY-MM" del mes anterior */
function prevMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number)
  if (m === 1) return `${y - 1}-12`
  return `${y}-${String(m - 1).padStart(2, "0")}`
}

/** Retorna "YYYY-MM" del mes siguiente */
function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number)
  if (m === 12) return `${y + 1}-01`
  return `${y}-${String(m + 1).padStart(2, "0")}`
}

/**
 * Genera los días de la grilla para el mes dado.
 * La grilla siempre empieza en lunes y termina en domingo.
 */
function buildGrid(ym: string): { date: string; day: number; isCurrentMonth: boolean }[] {
  const [year, month] = ym.split("-").map(Number)
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const dayOfWeek = firstDay.getUTCDay()
  const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const start = new Date(firstDay)
  start.setUTCDate(start.getUTCDate() - daysBack)

  const lastDay = new Date(Date.UTC(year, month, 0))
  const lastDayOfWeek = lastDay.getUTCDay()
  const daysForward = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek

  const end = new Date(lastDay)
  end.setUTCDate(end.getUTCDate() + daysForward)

  const cells: { date: string; day: number; isCurrentMonth: boolean }[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const dateStr = cursor.toISOString().split("T")[0]!
    cells.push({
      date: dateStr,
      day: cursor.getUTCDate(),
      isCurrentMonth: cursor.getUTCMonth() === month - 1,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return cells
}

/** "YYYY-MM-DD" de hoy en UTC */
function todayString(): string {
  return new Date().toISOString().split("T")[0]!
}

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

export default function EventsCalendar({
  initialEntries,
  initialMonth,
  locale,
}: EventsCalendarProps) {
  const t = useTranslations("calendar")
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [entries, setEntries] = useState<CalendarEntry[]>(initialEntries)
  const [loading, setLoading] = useState(false)
  const [popup, setPopup] = useState<PopupState | null>(null)

  const today = todayString()
  const [, month] = currentMonth.split("-").map(Number)
  const [year] = currentMonth.split("-").map(Number)
  const grid = buildGrid(currentMonth)

  // Agrupar entries por fecha
  const entriesByDate = new Map<string, CalendarEntry[]>()
  for (const entry of entries) {
    const list = entriesByDate.get(entry.date) ?? []
    list.push(entry)
    entriesByDate.set(entry.date, list)
  }

  async function navigateTo(ym: string) {
    setLoading(true)
    setPopup(null)
    try {
      const res = await fetch(`/api/calendar?month=${ym}`)
      if (res.ok) {
        const json = await res.json()
        setEntries(json.data.entries)
      }
    } finally {
      setLoading(false)
      setCurrentMonth(ym)
    }
  }

  const handleEntryClick = useCallback(
    (entry: CalendarEntry, rect: DOMRect | null) => {
      setPopup({ entry, anchorRect: rect })
    },
    []
  )

  const monthName = t(`months.${month}` as Parameters<typeof t>[0])

  return (
    <div className="relative">
      {/* Nav del mes */}
      <div className="flex items-center justify-between pb-6">
        <button
          onClick={() => navigateTo(prevMonth(currentMonth))}
          disabled={loading}
          aria-label={t("navPrev")}
          className="border border-border rounded-m px-4 py-2 text-body-s text-fg-secondary hover:text-fg-primary transition-colors disabled:opacity-40"
        >
          ←{" "}
          {t(
            `months.${parseInt(prevMonth(currentMonth).split("-")[1]!, 10)}` as Parameters<typeof t>[0]
          )}
        </button>

        <div className="text-center">
          <p className="text-caption text-fg-tertiary tracking-widest uppercase mb-1">
            {year}
          </p>
          <h1 className="text-heading-m font-display font-bold text-fg-primary">
            {monthName}
          </h1>
        </div>

        <button
          onClick={() => navigateTo(nextMonth(currentMonth))}
          disabled={loading}
          aria-label={t("navNext")}
          className="border border-border rounded-m px-4 py-2 text-body-s text-fg-secondary hover:text-fg-primary transition-colors disabled:opacity-40"
        >
          {t(
            `months.${parseInt(nextMonth(currentMonth).split("-")[1]!, 10)}` as Parameters<typeof t>[0]
          )}{" "}
          →
        </button>
      </div>

      {/* Cabeceras de días */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_KEYS.map((key) => (
          <div
            key={key}
            className="text-center text-[10px] font-bold tracking-widest uppercase text-fg-tertiary/50 py-2"
          >
            {t(`weekdays.${key}`)}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div
        className={cn(
          "grid grid-cols-7 gap-0.5 transition-opacity",
          loading && "opacity-50 pointer-events-none"
        )}
      >
        {grid.map((cell) => (
          <CalendarDayCell
            key={cell.date}
            day={cell.day}
            isCurrentMonth={cell.isCurrentMonth}
            isToday={cell.date === today}
            entries={entriesByDate.get(cell.date) ?? []}
            onEntryClick={handleEntryClick}
          />
        ))}
      </div>

      {/* Estado vacío */}
      {!loading && entries.length === 0 && (
        <p className="text-center text-fg-tertiary text-body py-12">
          {t("noEvents")}
        </p>
      )}

      {/* Popup */}
      {popup && (
        <CalendarEventPopup
          entry={popup.entry}
          anchorRect={popup.anchorRect}
          locale={locale}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
