/**
 * `/impressum` — aviso legal exigido por § 5 DDG para todo sitio web
 * operado desde Alemania.
 *
 * La versión alemana es la legalmente vinculante; ES/EN son traducciones
 * de cortesía (lo aclara `bindingNote`, que solo se muestra fuera de DE).
 *
 * Los datos legales fijos (dirección c/o, email) viven en
 * `@/components/legal/legal-data` — compartidos con `/datenschutz`, no en
 * i18n: son idénticos en los 3 idiomas y deben coincidir EXACTAMENTE con
 * lo registrado. Solo el copy de las secciones se resuelve vía i18n.
 *
 * Server component estático.
 */

import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import LegalShell from "@/components/legal/LegalShell"
import LegalSection from "@/components/legal/LegalSection"
import {
  LEGAL_ADDRESS_LINES,
  LEGAL_CONTACT_EMAIL,
  LEGAL_LINK_CLASS,
} from "@/components/legal/legal-data"

const ODR_URL = "https://ec.europa.eu/consumers/odr/"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "impressum" })
  return {
    title: `${t("metaTitle")} · La Huella del Caminante`,
    description: t("metaDescription"),
  }
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "impressum" })

  // La nota "la versión alemana es la vinculante" solo tiene sentido en
  // las versiones de cortesía (ES/EN), no en la alemana.
  const showBindingNote = locale !== "de"

  return (
    <LegalShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      note={showBindingNote ? t("bindingNote") : undefined}
    >
      <LegalSection heading={t("providerHeading")}>
        <address className="not-italic">
          {LEGAL_ADDRESS_LINES.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
      </LegalSection>

      <LegalSection heading={t("contactHeading")}>
        <p>
          {t("contactEmailLabel")}{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className={LEGAL_LINK_CLASS}>
            {LEGAL_CONTACT_EMAIL}
          </a>
        </p>
        <p>
          {t.rich("contactForm", {
            contactLink: (chunks) => (
              <Link href="/contact" className={LEGAL_LINK_CLASS}>
                {chunks}
              </Link>
            ),
          })}
        </p>
      </LegalSection>

      <LegalSection heading={t("responsibleHeading")}>
        <p>{t("responsibleBody")}</p>
      </LegalSection>

      <LegalSection heading={t("authorityHeading")}>
        <p>{t("authorityBody")}</p>
      </LegalSection>

      <LegalSection heading={t("euDisputeHeading")}>
        <p>
          {t.rich("euDisputeBody", {
            odrLink: (chunks) => (
              <a
                href={ODR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={LEGAL_LINK_CLASS}
              >
                {chunks}
              </a>
            ),
          })}
        </p>
        <p>{t("euDisputeNote")}</p>
      </LegalSection>

      <LegalSection heading={t("liabilityContentHeading")}>
        <p>{t("liabilityContentBody")}</p>
      </LegalSection>

      <LegalSection heading={t("liabilityLinksHeading")}>
        <p>{t("liabilityLinksBody")}</p>
      </LegalSection>

      <LegalSection heading={t("copyrightHeading")}>
        <p>{t("copyrightBody")}</p>
      </LegalSection>
    </LegalShell>
  )
}
