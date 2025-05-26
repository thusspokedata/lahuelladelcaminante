import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "legal.impressum" });
  const footerT = await getTranslations({ locale, namespace: "footer" });
  
  return {
    title: `${footerT("impressum")} | La Huella del Caminante`,
    description: t("description"),
  };
}

export default async function ImpressumPage({ params: { locale } }: { params: { locale: string } }) {
  
  // Get translations
  const t = await getTranslations({ locale, namespace: "legal.impressum" });
  const legalT = await getTranslations({ locale, namespace: "legal" });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

      <div className="space-y-6">
        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("infoAccordingTo")}</h2>
          <p>La Huella del Caminante</p>
          <p>Antonio Saleme</p>
          <p>Uferstr. 19</p>
          <p>13357, Berlin</p>
          <p>Deutschland</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("contact")}</h2>
          <p>Email: info@lahuelladelcaminante.de</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("contentResponsibility")}</h2>
          <p>
            {t("contentResponsibilityText1")}
          </p>
          <p>
            {t("contentResponsibilityText2")}
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("externalLinks")}</h2>
          <p>
            {t("externalLinksText1")}
          </p>
          <p>
            {t("externalLinksText2")}
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("copyright")}</h2>
          <p>
            {t("copyrightText")}
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link href={`/${locale}`} className="text-primary hover:underline">
          ← {legalT("backToHome")}
        </Link>
      </div>
    </div>
  );
}
