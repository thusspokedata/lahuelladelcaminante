/**
 * `/contact` — pantalla pública para enviar mensajes al founder.
 *
 * Reemplaza el `mailto:info@lahuelladelcaminante.de` que vivía en el
 * footer y exponía el email a scrapers. El form va a un route handler
 * que dispara un email pre-clasificado por tipo de consulta.
 *
 * Layout simple centrado (un form no necesita 1280px). Bloque de
 * alternativas debajo: Instagram externo + link al flujo `/apply` para
 * artistas (no mezclar tracks).
 *
 * Server async — la i18n se resuelve acá; el form interno es client.
 */

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ExternalLink } from "lucide-react"
import { Link } from "@/i18n/navigation"
import Eyebrow from "@/components/ui/Eyebrow"
import ContactForm from "@/components/contact/ContactForm"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "contact" })
  return {
    title: `${t("metaTitle")} · La Huella del Caminante`,
    description: t("metaDescription"),
  }
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "contact" })

  return (
    <div className="max-w-2xl mx-auto px-m sm:px-l py-l lg:py-xl flex flex-col gap-2xl">
      <header className="flex flex-col gap-m">
        <Eyebrow accent="brand">{t("eyebrow")}</Eyebrow>
        <h1 className="text-display-m sm:text-display-l font-display text-fg-primary leading-[0.95]">
          {t("title")}
        </h1>
        <p className="text-body-l text-fg-secondary leading-relaxed">
          {t.rich("body", {
            applyLink: (chunks) => (
              <Link
                href="/apply"
                className="font-semibold text-brand hover:text-brand-dim transition-colors"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </header>

      <ContactForm />

      <section
        aria-labelledby="alternatives-heading"
        className="flex flex-col gap-m border-t border-border pt-l"
      >
        <Eyebrow as="h2" className="block" >
          <span id="alternatives-heading">{t("alternatives.title")}</span>
        </Eyebrow>
        <ul className="flex flex-col gap-s text-body text-fg-secondary">
          <li>
            <a
              href="https://www.instagram.com/lahuelladelcaminante/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-xs font-medium text-fg-primary hover:underline"
            >
              {t("alternatives.instagramLabel")}
              <ExternalLink className="w-4 h-4" aria-hidden />
            </a>
          </li>
          <li>
            {t.rich("alternatives.artist", {
              applyLink: (chunks) => (
                <Link
                  href="/apply"
                  className="font-semibold text-brand hover:text-brand-dim transition-colors"
                >
                  {chunks}
                </Link>
              ),
            })}
          </li>
        </ul>
      </section>
    </div>
  )
}
