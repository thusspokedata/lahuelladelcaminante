"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function SiteTitle() {
  const pathname = usePathname();
  const t = useTranslations("home");

  // Check if we're on the homepage (including localized routes like /en, /es, /de)
  const isHomePage = pathname === "/" || pathname.match(/^\/[a-z]{2}$/);

  if (!isHomePage) {
    return null;
  }

  return (
    <Link href="/" className="ml-2 hidden flex-col md:flex">
      <h1 className="text-xl leading-tight font-bold">{t("title")}</h1>
      <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
    </Link>
  );
}
