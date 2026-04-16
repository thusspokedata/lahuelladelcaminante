import { getTranslations } from "next-intl/server"
import { getUpcomingEvents, getActiveGenres } from "@/services/events"
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
  const [events, genres] = await Promise.all([getUpcomingEvents(), getActiveGenres()])
  const featured = events.slice(0, 6)

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Dark base */}
        <div className="absolute inset-0 bg-[#0e0407]" />
        {/* Colour blobs */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 60% at 15% 55%, oklch(0.42 0.22 20 / 0.55) 0%, transparent 60%)," +
              "radial-gradient(ellipse 55% 70% at 85% 25%, oklch(0.38 0.14 55 / 0.40) 0%, transparent 60%)",
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-28 sm:py-36 text-center">
          <div className="inline-flex items-center gap-2.5 bg-white/8 backdrop-blur-sm text-white/75 text-[11px] font-bold px-5 py-2 rounded-full border border-white/12 uppercase tracking-[0.2em] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Berlín · Música Latina
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none text-white mb-6">
            La Huella
            <br />
            <span className="text-primary drop-shadow-lg">del Caminante</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/55 max-w-lg mx-auto mb-10 leading-relaxed">
            La escena musical latinoamericana en Berlín, Múnich, Hamburgo y más ciudades alemanas.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              asChild
              size="lg"
              className="font-bold rounded-full px-10 h-12 text-base shadow-xl shadow-primary/40"
            >
              <Link href={`/${locale}/events`}>Ver eventos</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="rounded-full px-10 h-12 text-base font-semibold border border-white/20 text-white bg-white/5 hover:bg-white/15 hover:text-white shadow-none"
            >
              <Link href={`/${locale}/artists`}>Artistas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Upcoming events ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-[0.18em] mb-1.5">
              Próximos eventos
            </p>
            <h2 className="text-3xl font-black">{t("title")}</h2>
          </div>
          <Button variant="ghost" asChild className="font-semibold text-primary hover:text-primary hover:bg-primary/8 rounded-full">
            <Link href={`/${locale}/events`}>Ver todos →</Link>
          </Button>
        </div>

        {featured.length > 0 ? (
          <EventList events={featured} />
        ) : (
          <div className="text-center py-24 rounded-2xl border-2 border-dashed border-border">
            <div className="text-5xl mb-4">🎸</div>
            <p className="text-muted-foreground font-medium">Próximamente los primeros eventos</p>
          </div>
        )}
      </section>

      {/* ── Genre strip (only shown if there are genres) ─── */}
      {genres.length > 0 && (
        <section className="border-t border-border bg-muted/25 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6 text-center">
              Explora por género
            </p>
            <div className="flex flex-wrap gap-2.5 justify-center">
              {genres.map((g) => (
                <Link
                  key={g}
                  href={`/${locale}/events?genre=${encodeURIComponent(g)}`}
                  className="px-5 py-2 rounded-full border border-border bg-card text-sm font-semibold text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm hover:shadow-md hover:shadow-primary/20 hover:-translate-y-0.5"
                >
                  {g}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
