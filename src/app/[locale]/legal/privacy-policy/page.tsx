import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  const footerT = await getTranslations({ locale, namespace: "footer" });
  
  return {
    title: `${footerT("privacy")} | La Huella del Caminante`,
    description: t("title"),
  };
}

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Get translations
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  const legalT = await getTranslations({ locale, namespace: "legal" });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

      <div className="space-y-6">
        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("generalInfo")}</h2>
          <p>
            {t("generalInfoText1")}
          </p>
          <p>
            {t("generalInfoText2")}
          </p>
          <p className="mt-2">
            La Huella del Caminante
            <br />
            Antonio Saleme
            <br />
            Uferstr. 19
            <br />
            13357, Berlin
            <br />
            Deutschland
            <br />
            Email: info@lahuelladelcaminante.de
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("dataCollection")}</h2>
          <p>
            {t("dataCollectionText")}
          </p>
          <ul className="mt-2 list-disc pl-6">
            <li>{t("dataCollectionItem1")}</li>
            <li>{t("dataCollectionItem2")}</li>
            <li>{t("dataCollectionItem3")}</li>
          </ul>
          <p className="mt-2">
            {t("dataCollectionFooter")}
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("purpose")}</h2>
          <p>{t("purposeText")}</p>
          <ul className="mt-2 list-disc pl-6">
            <li>{t("purposeItem1")}</li>
            <li>{t("purposeItem2")}</li>
            <li>{t("purposeItem3")}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("legalBasis")}</h2>
          <p>{t("legalBasisText")}</p>
          <ul className="mt-2 list-disc pl-6">
            <li>{t("legalBasisItem1")}</li>
            <li>{t("legalBasisItem2")}</li>
            <li>{t("legalBasisItem3")}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("serviceProviders")}</h2>
          <p>
            {t("serviceProvidersText")}
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("rights")}</h2>
          <p>{t("rightsText")}</p>
          <ul className="mt-2 list-disc pl-6">
            <li>{t("rightsItem1")}</li>
            <li>{t("rightsItem2")}</li>
            <li>{t("rightsItem3")}</li>
            <li>{t("rightsItem4")}</li>
            <li>{t("rightsItem5")}</li>
          </ul>
          <p className="mt-2">
            {t("rightsFooter")}
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("changes")}</h2>
          <p>
            {t("changesText")}
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
