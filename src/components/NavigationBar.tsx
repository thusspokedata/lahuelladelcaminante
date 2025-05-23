"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { HomeButton } from "./HomeButton";
import { SiteTitle } from "./SiteTitle";
import { MobileTitle } from "./MobileTitle";
import { AdminNavLink } from "./AdminNavLink";
import { DashboardLink } from "./DashboardLink";

interface NavigationBarProps {
  LanguageSwitcher: React.ComponentType;
}

export function NavigationBar({ LanguageSwitcher }: NavigationBarProps) {
  const t = useTranslations("navigation");
  const locale = useLocale();

  return (
    <header className="flex flex-col">
      <div className="flex h-16 items-center justify-between p-4">
        <div className="flex items-center">
          <HomeButton />
          <SiteTitle />
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <SignedOut>
            <Link href={`/${locale}/sign-in`}>
              <Button variant="outline">{t("signIn")}</Button>
            </Link>
            <Link href={`/${locale}/sign-up`}>
              <Button>{t("signUp")}</Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <AdminNavLink />
            <DashboardLink />
            <UserButton />
          </SignedIn>
        </div>
      </div>

      <MobileTitle />
    </header>
  );
}
