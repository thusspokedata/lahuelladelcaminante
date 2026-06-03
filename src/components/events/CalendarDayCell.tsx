"use client"

/**
 * CalendarDayCell — celda individual de la grilla del calendario.
 *
 * Muestra el número del día, los pills de eventos (max 2 visibles,
 * el resto colapsa en "+N más"), y llama a onEntryClick al hacer click.
 * Si `day` es null, renderiza una celda vacía (días de meses adyacentes
 * que no pertenecen al mes visible — se muestran atenuados).
 */

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { CalendarEntry } from "@/services/calendar"

const MAX_VISIBLE = 2

interface CalendarDayCellProps {
  day: number | null
  isCurrentMonth: boolean
  isToday: boolean
  entries: CalendarEntry[]
  onEntryClick: (entry: CalendarEntry, rect: DOMRect | null) => void
}

export default function CalendarDayCell({
  day,
  isCurrentMonth,
  isToday,
  entries,
  onEntryClick,
}: CalendarDayCellProps) {
  const [expanded, setExpanded] = useState(false)

  const hasEvents = entries.length > 0
  const hasOfficial = entries.some((e) => e.type === "event")
  const hasScene = entries.some((e) => e.type === "scene")

  const visible = expanded ? entries : entries.slice(0, MAX_VISIBLE)
  const hiddenCount = entries.length - MAX_VISIBLE

  function handlePillClick(
    e: React.MouseEvent<HTMLButtonElement>,
    entry: CalendarEntry
  ) {
    e.stopPropagation()
    const isMobile = window.innerWidth < 768
    const rect = isMobile ? null : e.currentTarget.getBoundingClientRect()
    onEntryClick(entry, rect)
  }

  return (
    <div
      className={cn(
        "min-h-[80px] p-1.5 rounded-lg border transition-colors",
        !isCurrentMonth && "opacity-30",
        hasEvents && hasOfficial && !hasScene && "border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.05)]",
        hasEvents && hasScene && !hasOfficial && "border-[rgba(229,169,59,0.25)] bg-[rgba(229,169,59,0.04)]",
        hasEvents && hasOfficial && hasScene && "border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.05)]",
        !hasEvents && "border-transparent",
        isToday && "border-white/20 bg-white/[0.03]"
      )}
    >
      {/* Número del día */}
      <div className="mb-1.5">
        {isToday ? (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-fg-primary text-bg-page text-[11px] font-bold">
            {day}
          </span>
        ) : (
          <span
            className={cn(
              "text-[11px]",
              isCurrentMonth ? "text-fg-tertiary" : "text-fg-tertiary/50"
            )}
          >
            {day}
          </span>
        )}
      </div>

      {/* Pills */}
      <div className="flex flex-col gap-0.5">
        {visible.map((entry) => (
          <button
            key={entry.id}
            onClick={(e) => handlePillClick(e, entry)}
            className={cn(
              "w-full text-left rounded px-1.5 py-0.5 text-[10px] font-semibold truncate cursor-pointer transition-opacity hover:opacity-80",
              entry.type === "event"
                ? "bg-brand text-on-brand"
                : "bg-[rgba(229,169,59,0.18)] border border-[rgba(229,169,59,0.4)] text-[#e5a93b]"
            )}
          >
            {entry.title}
          </button>
        ))}

        {/* +N más */}
        {!expanded && hiddenCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(true)
            }}
            className="w-full text-left rounded px-1.5 py-0.5 text-[9px] font-semibold text-fg-tertiary border border-dashed border-fg-tertiary/30 hover:border-fg-tertiary/60 transition-colors"
          >
            +{hiddenCount} más
          </button>
        )}
      </div>
    </div>
  )
}
