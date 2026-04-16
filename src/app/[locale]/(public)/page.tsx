import { getTranslations } from "next-intl/server"
import { getUpcomingEvents } from "@/services/events"
import { EventList } from "@/components/events/EventList"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "events" })
  const events = await getUpcomingEvents()
  const featured = events.slice(0, 6)

  return (
    <div className="space-y-10">
      <section className="text-center py-12 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">La Huella del Caminante</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Música latinoamericana en Berlín
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href={`/${locale}/events`}>{t("title")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/${locale}/artists`}>Artistas</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t("title")}</h2>
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/events`}>Ver todos →</Link>
          </Button>
        </div>
        <EventList events={featured} />
      </section>
    </div>
  )
}
