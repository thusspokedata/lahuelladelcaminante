/**
 * `/events/calendar` — vista mensual pública de todos los eventos.
 *
 * Server Component: renderiza el mes actual con datos frescos.
 * El Client Component `EventsCalendar` maneja navegación mes a mes.
 */

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getCalendarEntries } from "@/services/calendar"
import EventsCalendar from "@/components/events/EventsCalendar"

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "calendar" })
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  }
}

/** Calcula los límites de la grilla para el mes actual (UTC). */
function currentMonthGridBounds(): { from: Date; to: Date; ym: string } {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1

  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const dayOfWeek = firstDay.getUTCDay()
  const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const from = new Date(firstDay)
  from.setUTCDate(from.getUTCDate() - daysBack)

  const lastDay = new Date(Date.UTC(year, month, 0))
  const lastDayOfWeek = lastDay.getUTCDay()
  const daysForward = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek
  const to = new Date(lastDay)
  to.setUTCDate(to.getUTCDate() + daysForward)
  to.setUTCHours(23, 59, 59, 999)

  const ym = `${year}-${String(month).padStart(2, "0")}`
  return { from, to, ym }
}

export default async function EventsCalendarPage({ params }: PageProps) {
  const { locale } = await params
  const { from, to, ym } = currentMonthGridBounds()
  const initialEntries = await getCalendarEntries(from, to)

  return (
    <div className="max-w-7xl mx-auto px-m sm:px-l py-l lg:py-xl">
      <EventsCalendar
        initialEntries={initialEntries}
        initialMonth={ym}
        locale={locale}
      />
    </div>
  )
}
