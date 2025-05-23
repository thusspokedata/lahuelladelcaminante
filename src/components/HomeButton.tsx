"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function HomeButton() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  if (isHomePage) {
    return <div></div>;
  }

  return (
    <Link href="/">
      <Button variant="outline">{t("backToHome")}</Button>
    </Link>
  );
}
