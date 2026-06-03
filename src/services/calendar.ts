/**
 * Servicio de calendario — agrega entradas de Event y SceneEvent
 * en el rango de fechas visible en la grilla mensual.
 */
import "server-only"

import { prisma } from "@/lib/prisma"

export interface CalendarEntry {
  id: string
  type: "event" | "scene"
  /** ISO date string "YYYY-MM-DD" */
  date: string
  title: string
  venue: string | null
  time: string | null
  slug: string | null
  externalUrl: string | null
}

/**
 * Retorna todas las entradas (Event + SceneEvent) en el rango [from, to].
 * `from` y `to` son los límites de la grilla (primer lunes visible al
 * último domingo visible), pueden extenderse fuera del mes pedido.
 */
export async function getCalendarEntries(
  from: Date,
  to: Date
): Promise<CalendarEntry[]> {
  const [events, sceneEvents] = await Promise.all([
    prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: from, lte: to } } },
      },
      include: {
        dates: {
          where: { date: { gte: from, lte: to } },
          orderBy: { date: "asc" },
        },
      },
    }),
    prisma.sceneEvent.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    }),
  ])

  const entries: CalendarEntry[] = []

  for (const event of events) {
    for (const d of event.dates) {
      entries.push({
        id: `${event.id}__${d.id}`,
        type: "event",
        date: d.date.toISOString().split("T")[0]!,
        title: event.title,
        venue: event.location,
        time: event.time ?? null,
        slug: event.slug,
        externalUrl: null,
      })
    }
  }

  for (const se of sceneEvents) {
    entries.push({
      id: se.id,
      type: "scene",
      date: se.date.toISOString().split("T")[0]!,
      title: se.title,
      venue: se.venue ?? null,
      time: null,
      slug: null,
      externalUrl: se.externalUrl ?? null,
    })
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date))
}
