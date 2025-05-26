import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "legal" });
  
  return {
    title: `${t("title")} | La Huella del Caminante`,
    description: t("description"),
  };
}

export default async function LegalIndexPage({ params: { locale } }: { params: { locale: string } }) {
  
  // Get translations
  const t = await getTranslations({ locale, namespace: "legal" });
  const footerT = await getTranslations({ locale, namespace: "footer" });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

      <p className="text-muted-foreground mb-6">
        {t("description")}
      </p>

      <div className="space-y-4">
        <Link
          href={`/${locale}/legal/impressum`}
          className="border-border hover:border-primary hover:bg-secondary/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
        >
          <div>
            <h2 className="text-xl font-medium">{footerT("impressum")}</h2>
            <p className="text-muted-foreground">
              {t("impressum.description")}
            </p>
          </div>
          <ChevronRight className="text-primary h-5 w-5" />
        </Link>

        <Link
          href={`/${locale}/legal/privacy-policy`}
          className="border-border hover:border-primary hover:bg-secondary/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
        >
          <div>
            <h2 className="text-xl font-medium">{footerT("privacy")}</h2>
            <p className="text-muted-foreground">
              {t("privacy.title")}
            </p>
          </div>
          <ChevronRight className="text-primary h-5 w-5" />
        </Link>
      </div>

      <div className="mt-8">
        <Link href={`/${locale}`} className="text-primary hover:underline">
          ← {t("backToHome")}
        </Link>
      </div>
    </div>
  );
}
