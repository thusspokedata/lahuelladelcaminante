/**
 * GET /api/calendar?month=YYYY-MM
 *
 * Retorna CalendarEntry[] para la grilla mensual completa (incluye días
 * de meses adyacentes para completar la primera y última semana).
 * No requiere auth — es público.
 */
import { NextResponse } from "next/server"
import { getCalendarEntries } from "@/services/calendar"

/** Calcula los límites de la grilla de un mes: primer lunes visible y
 *  último domingo visible. La grilla arranca siempre en lunes. */
function calendarGridBounds(year: number, month: number): { from: Date; to: Date } {
  // Primer día del mes (month es 1-indexed)
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const dayOfWeek = firstDay.getUTCDay() // 0=Dom, 1=Lun ... 6=Sáb
  const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const from = new Date(firstDay)
  from.setUTCDate(from.getUTCDate() - daysBack)

  // Último día del mes
  const lastDay = new Date(Date.UTC(year, month, 0))
  const lastDayOfWeek = lastDay.getUTCDay()
  const daysForward = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek
  const to = new Date(lastDay)
  to.setUTCDate(to.getUTCDate() + daysForward)
  // Incluir hasta el final del día
  to.setUTCHours(23, 59, 59, 999)

  return { from, to }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month")

  if (!month || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month)) {
    return NextResponse.json({ error: "invalid_month" }, { status: 400 })
  }

  const [yearStr, monthStr] = month.split("-")
  const year = parseInt(yearStr!, 10)
  const m = parseInt(monthStr!, 10)

  const { from, to } = calendarGridBounds(year, m)
  const entries = await getCalendarEntries(from, to)

  return NextResponse.json({ data: { entries } })
}
