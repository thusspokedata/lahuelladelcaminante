/**
 * `/datenschutz` — Datenschutzerklärung (política de privacidad) exigida
 * por la DSGVO/GDPR para todo sitio que trate datos personales.
 *
 * La versión alemana es la legalmente vinculante; ES/EN son traducciones
 * de cortesía. El responsable y la dirección coinciden con el Impressum
 * (datos compartidos en `@/components/legal/legal-data`).
 *
 * Terceros declarados: Cloudinary (imágenes), Resend (emails), Neon
 * (base de datos). Analytics: Umami self-hosted (sección propia, NO va
 * en processors — los datos no salen de nuestro servidor). Es cookieless,
 * así que la sección de cookies sigue siendo exacta. El sitio NO usa
 * Google OAuth.
 *
 * Server component estático.
 */

import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import LegalShell from "@/components/legal/LegalShell"
import LegalSection from "@/components/legal/LegalSection"
import {
  LEGAL_ADDRESS_LINES,
  LEGAL_CONTACT_EMAIL,
  LEGAL_LINK_CLASS,
} from "@/components/legal/legal-data"

/** Encargados del tratamiento: clave i18n del párrafo + URL de su
 * política de privacidad. La tabla ata clave y URL juntas para que un
 * reorden no cruce el link de un processor con el de otro. */
const PROCESSORS = [
  { key: "processorsCloudinary", url: "https://cloudinary.com/privacy" },
  { key: "processorsResend", url: "https://resend.com/legal/privacy-policy" },
  { key: "processorsNeon", url: "https://neon.tech/privacy-policy" },
] as const

/** Derechos DSGVO del usuario, en el orden de render. */
const RIGHTS_KEYS = [
  "rightAccess",
  "rightRectification",
  "rightErasure",
  "rightRestriction",
  "rightPortability",
  "rightObjection",
  "rightComplaint",
] as const

function externalLink(href: string) {
  return function ExternalChunk(chunks: React.ReactNode) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={LEGAL_LINK_CLASS}
      >
        {chunks}
      </a>
    )
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "datenschutz" })
  return {
    title: `${t("metaTitle")} · La Huella del Caminante`,
    description: t("metaDescription"),
  }
}

export default async function DatenschutzPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "datenschutz" })

  const showBindingNote = locale !== "de"

  return (
    <LegalShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      note={showBindingNote ? t("bindingNote") : undefined}
    >
      <LegalSection heading={t("controllerHeading")}>
        <p>{t("controllerIntro")}</p>
        <address className="not-italic">
          {LEGAL_ADDRESS_LINES.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className={`${LEGAL_LINK_CLASS} mt-xs block`}
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
        </address>
      </LegalSection>

      <LegalSection heading={t("generalHeading")}>
        <p>{t("generalBody")}</p>
      </LegalSection>

      <LegalSection heading={t("collectionHeading")}>
        <p>{t("collectionAccount")}</p>
        <p>{t("collectionContact")}</p>
        <p>{t("collectionApplication")}</p>
      </LegalSection>

      <LegalSection heading={t("hostingHeading")}>
        <p>{t("hostingBody")}</p>
      </LegalSection>

      <LegalSection heading={t("processorsHeading")}>
        <p>{t("processorsIntro")}</p>
        {PROCESSORS.map(({ key, url }) => (
          <p key={key}>{t.rich(key, { link: externalLink(url) })}</p>
        ))}
      </LegalSection>

      <LegalSection heading={t("cookiesHeading")}>
        <p>{t("cookiesBody")}</p>
      </LegalSection>

      <LegalSection heading={t("analyticsHeading")}>
        <p>{t("analyticsBody")}</p>
      </LegalSection>

      <LegalSection heading={t("rightsHeading")}>
        <p>{t("rightsIntro")}</p>
        <ul className="flex list-disc flex-col gap-xs pl-l">
          {RIGHTS_KEYS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection heading={t("securityHeading")}>
        <p>{t("securityBody")}</p>
      </LegalSection>
    </LegalShell>
  )
}
