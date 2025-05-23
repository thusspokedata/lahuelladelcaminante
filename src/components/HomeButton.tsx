"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function HomeButton() {
  const t = useTranslations("common");
  const pathname = usePathname();

  // Check if we're on the homepage (including localized routes like /en, /es, /de)
  const isHomePage = pathname === "/" || pathname.match(/^\/[a-z]{2}$/);

  if (isHomePage) {
    return null;
  }

  return (
    <Link href="/">
      <Button variant="outline">{t("backToHome")}</Button>
    </Link>
  );
}
