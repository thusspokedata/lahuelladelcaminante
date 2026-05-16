import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { getEventBySlug } from "@/services/events"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Clock, Ticket, Users, ArrowLeft, Navigation } from "lucide-react"

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const t = await getTranslations({ locale, namespace: "events" })
  const tCommon = await getTranslations({ locale, namespace: "common" })
  const tForms = await getTranslations({ locale, namespace: "forms" })
  const event = await getEventBySlug(slug)

  if (!event) notFound()

  return (
    <div>
      {/* Hero image */}
      <div className="relative w-full h-72 sm:h-96 bg-gradient-to-br from-primary/20 via-accent/10 to-background overflow-hidden">
        {event.coverImage ? (
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-10 select-none">
            🎶
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Genre badge */}
        {event.genre && (
          <div className="absolute top-5 right-5 bg-primary text-primary-foreground text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
            {event.genre}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 -mt-8 relative">
        <Button variant="ghost" asChild className="mb-6 text-muted-foreground hover:text-foreground rounded-full -ml-2">
          <Link href={`/${locale}/events`}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {tCommon("back")}
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-4xl sm:text-5xl font-black leading-tight">{event.title}</h1>

            {event.description && (
              <p className="text-muted-foreground leading-relaxed text-base">{event.description}</p>
            )}

            {/* Artist card */}
            {event.artist && (
              <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{tForms("artistField")}</p>
                  <Link
                    href={`/${locale}/artists/${event.artist.slug}`}
                    className="text-lg font-bold hover:text-primary transition-colors"
                  >
                    {event.artist.name}
                  </Link>
                  {event.artist.origin && (
                    <p className="text-sm text-muted-foreground">{event.artist.origin}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
              {/* Dates */}
              <div className="flex gap-3">
                <CalendarDays className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                    {event.dates.length > 1 ? t("dates") : t("date")}
                  </p>
                  <div className="space-y-0.5">
                    {event.dates.map((d, i) => (
                      <p key={i} className="text-sm font-medium">{formatDate(d, locale)}</p>
                    ))}
                  </div>
                </div>
              </div>

              {event.time && (
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">{tForms("time")}</p>
                    <p className="text-sm font-medium">{event.time}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">{tForms("venue")}</p>
                  <p className="text-sm font-medium">{event.location}</p>
                  {event.address && (
                    <p className="text-sm text-muted-foreground mt-0.5">{event.address}</p>
                  )}
                </div>
              </div>

              {event.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full justify-center bg-primary/8 hover:bg-primary/15 border border-primary/20 text-primary text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Abrir en Google Maps
                </a>
              )}

              {event.price && (
                <div className="flex gap-3">
                  <Ticket className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">{tForms("price")}</p>
                    <p className="text-sm font-medium">{event.price}</p>
                  </div>
                </div>
              )}

              {event.organizer && (
                <div className="flex gap-3">
                  <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">{tForms("organizer")}</p>
                    <p className="text-sm font-medium">{event.organizer}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
