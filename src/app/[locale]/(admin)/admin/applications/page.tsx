import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { ApplicationActions } from "./ApplicationActions"

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin" })

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
  })

  const pending = applications.filter((a) => a.status === "PENDING")
  const reviewed = applications.filter((a) => a.status !== "PENDING")

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold text-primary uppercase tracking-[0.15em] mb-1">{t("applicationsLabel")}</p>
        <h1 className="text-3xl font-black">{t("applications")}</h1>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
            {t("applicationsPending")} ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((app) => (
              <div key={app.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold">{app.name}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <a href={`mailto:${app.email}`} className="text-primary text-sm font-medium hover:underline">
                      {app.email}
                    </a>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="text-xs text-muted-foreground">{formatDate(app.createdAt, locale)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{app.message}</p>
                </div>
                <ApplicationActions id={app.id} email={app.email} name={app.name} />
              </div>
            ))}
          </div>
        </section>
      )}

      {pending.length === 0 && (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-border">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-muted-foreground font-medium">{t("applicationsNone")}</p>
        </div>
      )}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
            {t("applicationsReviewed")} ({reviewed.length})
          </h2>
          <div className="space-y-2">
            {reviewed.map((app) => (
              <div key={app.id} className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{app.name}</span>
                    <span className="text-xs text-muted-foreground">{app.email}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(app.createdAt, locale)}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  app.status === "APPROVED"
                    ? "bg-green-500/15 text-green-500"
                    : "bg-red-500/15 text-red-400"
                }`}>
                  {app.status === "APPROVED" ? t("applicationsApproved") : t("applicationsRejected")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
