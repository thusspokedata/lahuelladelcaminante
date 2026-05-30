/**
 * `/newsletter` — página pública de suscripción al newsletter.
 *
 * Muestra el formulario con contexto (qué es, cuándo llega) y maneja
 * los estados post-confirmación via searchParams:
 *  - ?confirmed=true → banner de éxito
 *  - ?error=token_expired → mensaje de link expirado
 *  - ?error=invalid_token → mensaje de link inválido (mismo que expired desde UX)
 */

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Eyebrow from "@/components/ui/Eyebrow"
import NewsletterForm from "@/components/newsletter/NewsletterForm"

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ confirmed?: string; error?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "newsletter" })
  return { title: t("pageTitle") }
}

export default async function NewsletterPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: "newsletter" })

  const initialState =
    sp.confirmed === "true"
      ? "confirmed"
      : sp.error === "token_expired" || sp.error === "invalid_token"
        ? "token_expired"
        : null

  return (
    <div className="max-w-7xl mx-auto px-m sm:px-l py-l lg:py-xl">
      <div className="max-w-lg">
        <div className="flex flex-col gap-l">
          <div className="flex flex-col gap-s">
            <Eyebrow as="p">Newsletter</Eyebrow>
            <h1 className="text-heading-l sm:text-display-m font-display text-fg-primary leading-tight">
              {t("pageTitle")}
            </h1>
            <p className="text-body text-fg-secondary leading-relaxed">
              {t("pageDescription")}
            </p>
          </div>
          <NewsletterForm variant="page" initialState={initialState} />
        </div>
      </div>
    </div>
  )
}
