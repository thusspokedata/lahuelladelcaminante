"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useSession, signOut } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { ThemeToggle } from "./ThemeToggle"

export function Header() {
  const t = useTranslations("nav")
  const locale = useLocale()
  const { data: session } = useSession()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="font-bold text-lg">
          La Huella del Caminante
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href={`/${locale}/events`} className="hover:text-foreground/80 transition-colors">
            {t("events")}
          </Link>
          <Link href={`/${locale}/artists`} className="hover:text-foreground/80 transition-colors">
            {t("artists")}
          </Link>
          {session && (
            <Link href={`/${locale}/dashboard`} className="hover:text-foreground/80 transition-colors">
              {t("dashboard")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {session ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
            >
              {t("signOut")}
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href={`/${locale}/sign-in`}>{t("signIn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
