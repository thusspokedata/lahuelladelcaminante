"use client"

import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import { useSession } from "@/lib/auth-client"

export function Footer() {
  const t = useTranslations("footer")
  const locale = useLocale()
  const currentYear = new Date().getFullYear()
  const { data: session } = useSession()

  const role = session?.user?.role?.toLowerCase()
  const canCreate = role === "creator" || role === "admin"

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-black shadow-sm">
              ♪
            </div>
            <div className="leading-tight">
              <div className="font-black text-sm">La Huella del Caminante</div>
              <div className="text-xs text-muted-foreground">{t("tagline")}</div>
            </div>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href={`/${locale}/events`} className="hover:text-foreground transition-colors">{t("events")}</Link>
            <Link href={`/${locale}/artists`} className="hover:text-foreground transition-colors">{t("artists")}</Link>
            <a
              href="https://www.instagram.com/lahuelladelcaminante/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Instagram
            </a>
            {canCreate && (
              <a
                href="mailto:info@lahuelladelcaminante.de"
                className="hover:text-foreground transition-colors"
              >
                info@lahuelladelcaminante.de
              </a>
            )}
            <Link href={`/${locale}/sign-in`} className="hover:text-foreground transition-colors">{t("login")}</Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground text-center">
          {t("copyright", { year: currentYear })}
        </div>
      </div>
    </footer>
  )
}
