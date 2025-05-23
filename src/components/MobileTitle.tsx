"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function MobileTitle() {
  const pathname = usePathname();
  const t = useTranslations("home");

  // Check if we're on the homepage (including localized routes like /en, /es, /de)
  const isHomePage = pathname === "/" || pathname.match(/^\/[a-z]{2}$/);

  if (!isHomePage) {
    return null;
  }

  return (
    <div className="pb-4 text-center md:hidden">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
    </div>
  );
}
