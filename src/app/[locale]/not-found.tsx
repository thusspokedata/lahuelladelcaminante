"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigations";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-4xl font-bold">404 - {t("pageNotFound")}</h1>
      <p className="text-muted-foreground mb-8">{t("pageNotFoundMessage")}</p>
      <Link href="/">
        <Button>{t("backToHome")}</Button>
      </Link>
    </div>
  );
}
