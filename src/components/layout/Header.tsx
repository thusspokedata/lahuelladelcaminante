"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useSession, signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "./LanguageSwitcher"

export function Header() {
  const t = useTranslations("nav")
  const locale = useLocale()
  const router = useRouter()
  const { data: session } = useSession()

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : null

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-black shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
            ♪
          </div>
          <span className="font-black text-sm leading-tight hidden sm:block tracking-tight">
            La Huella<br />
            <span className="text-primary">del Caminante</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href={`/${locale}/events`}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          >
            {t("events")}
          </Link>
          <Link
            href={`/${locale}/artists`}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          >
            {t("artists")}
          </Link>
          {session && (
            <Link
              href={`/${locale}/dashboard`}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            >
              {t("dashboard")}
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          <LanguageSwitcher />
          {session ? (
            <div className="flex items-center gap-2">
              {initials && (
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-center hidden sm:flex">
                  {initials}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs h-8 px-4"
                onClick={() =>
                  signOut({ fetchOptions: { onSuccess: () => router.push(`/${locale}`) } })
                }
              >
                {t("signOut")}
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="rounded-full h-8 px-5 text-xs font-semibold shadow-md shadow-primary/20">
              <Link href={`/${locale}/sign-in`}>{t("signIn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
