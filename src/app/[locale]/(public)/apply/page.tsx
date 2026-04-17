import { getTranslations } from "next-intl/server"
import { ApplyForm } from "@/components/apply/ApplyForm"
import { Music2, CalendarDays, MapPin } from "lucide-react"

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "apply" })

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0e0407]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 70% at 80% 30%, oklch(0.42 0.22 20 / 0.45) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-sm text-white/70 text-[11px] font-bold px-5 py-2 rounded-full border border-white/12 uppercase tracking-[0.2em] mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t("badge")}
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none text-white mb-5">
            {t("heroTitle")}
            <br />
            <span className="text-primary drop-shadow-lg">{t("heroSubtitle")}</span>
          </h1>
          <p className="text-lg text-white/55 max-w-xl leading-relaxed">
            {t("heroDescription")}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

        {/* Left — why join */}
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.18em] mb-2">{t("whyLabel")}</p>
          <h2 className="text-3xl font-black mb-6">{t("whyTitle")}</h2>
          <p className="text-muted-foreground leading-relaxed mb-10">{t("whyBody")}</p>

          <div className="space-y-5">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0 mt-0.5">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold mb-0.5">{t("feature1Title")}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("feature1Body")}</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold mb-0.5">{t("feature2Title")}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("feature2Body")}</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0 mt-0.5">
                <Music2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold mb-0.5">{t("feature3Title")}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("feature3Body")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <h3 className="text-xl font-black mb-1">{t("formTitle")}</h3>
          <p className="text-sm text-muted-foreground mb-7">{t("formSubtitle")}</p>
          <ApplyForm />
        </div>

      </section>
    </div>
  )
}
