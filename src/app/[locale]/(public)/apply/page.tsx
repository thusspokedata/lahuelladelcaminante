/**
 * `/apply` — pantalla pública para aplicar como creator.
 *
 * Rediseñada al sistema visual: layout simple centrado siguiendo el
 * patrón de `/contact` (max-w-2xl, eyebrow + h1 + body + form). Saca el
 * hero "marketing landing" enorme + feature cards (look pre-rediseño)
 * y queda alineada con el resto de las pantallas del flow.
 *
 * El form interno (`ApplyForm`) maneja el estado submit y al confirmar
 * renderiza inline `ApplySubmittedScreen` con el timeline de 4 pasos
 * (implementado en PR #22, no se toca acá).
 *
 * La ruta sigue siendo pública (no requiere login) — decisión cerrada:
 * preservamos el flow "aplicar antes de tener cuenta" que el hook
 * `user.create.after` de PR #23 activa automáticamente cuando el
 * applicant aprobado se registra después.
 *
 * Server async — i18n se resuelve acá; el form interno es client.
 */

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Eyebrow from "@/components/ui/Eyebrow"
import { ApplyForm } from "@/components/apply/ApplyForm"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "apply" })
  return {
    title: `${t("metaTitle")} · La Huella del Caminante`,
    description: t("metaDescription"),
  }
}

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "apply" })

  return (
    <div className="max-w-2xl mx-auto px-m sm:px-l py-l lg:py-xl flex flex-col gap-2xl">
      <header className="flex flex-col gap-m">
        <Eyebrow accent="brand">{t("eyebrow")}</Eyebrow>
        <h1 className="text-display-m sm:text-display-l font-display text-fg-primary leading-[0.95]">
          {t("title")}
        </h1>
        <p className="text-body-l text-fg-secondary leading-relaxed">
          {t("body")}
        </p>
      </header>

      <ApplyForm />
    </div>
  )
}
