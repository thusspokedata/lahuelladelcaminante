/**
 * 404 — pantalla cuando un slug dentro del locale no matchea (ej.
 * `/es/events/un-evento-que-no-existe`). Las pages de detalle invocan
 * `notFound()` desde `next/navigation` cuando la query devuelve null;
 * Next.js levanta este archivo automáticamente.
 *
 * Está fuera de los grupos `(public)/(protected)/(auth)` así que NO
 * hereda Header/Footer de esos layouts. Los importamos manualmente
 * para que el shell sea consistente con el resto del sitio.
 *
 * **Trade-off conocido**: el `<Footer />` es server async y consume
 * `getTranslations("footer")`/`("nav")`. Si una key faltase en un
 * locale, este Footer tiraría y la jerarquía Next escalaría el error
 * al `error.tsx` más cercano — es decir, navegar a un 404 terminaría
 * mostrando la pantalla de error genérica. Aceptamos el trade-off por
 * consistencia visual; cuando exista validación de tipos de mensajes
 * en CI (no existe hoy), el riesgo desaparece. Mitigación inmediata:
 * agregar siempre keys nuevas a los 3 locales — política del proyecto.
 *
 * Server async — el locale se resuelve con `getLocale()` (next-intl
 * lo lee del segment `[locale]` del request).
 */

import { getTranslations, getLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import Eyebrow from "@/components/ui/Eyebrow"
import BackHistoryButton from "@/components/ui/BackHistoryButton"

export default async function NotFoundPage() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "notFound" })

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-m py-2xl">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-m">
          <p
            aria-hidden
            className="text-[120px] sm:text-[180px] lg:text-[220px] font-display font-extrabold text-brand leading-none"
          >
            404
          </p>
          <Eyebrow accent="brand" className="text-brand-dim">
            {t("eyebrow")}
          </Eyebrow>
          <h1 className="text-display-m sm:text-display-l font-display text-fg-primary leading-tight">
            {t("title")}
          </h1>
          <p className="text-body-l text-fg-secondary max-w-[50ch] leading-relaxed">
            {t("body")}
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-s mt-m w-full sm:w-auto">
            <Link
              href="/events"
              className="inline-flex items-center justify-center rounded-pill bg-brand text-on-brand font-semibold px-l py-s text-body-s hover:bg-brand-dim transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page"
            >
              {t("cta.agenda")} →
            </Link>
            <BackHistoryButton label={t("cta.back")} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
