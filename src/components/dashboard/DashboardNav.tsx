"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface DashboardNavProps {
  role: string
}

export function DashboardNav({ role }: DashboardNavProps) {
  const t = useTranslations("dashboard")
  const tAdmin = useTranslations("admin")
  const locale = useLocale()
  const pathname = usePathname()

  const links = [
    { href: `/${locale}/dashboard`, label: t("title") },
    { href: `/${locale}/dashboard/events`, label: t("myEvents") },
    ...(role === "artist" || role === "admin"
      ? [{ href: `/${locale}/dashboard/artists`, label: t("myArtists") }]
      : []),
    ...(role === "admin"
      ? [
          { href: `/${locale}/admin/applications`, label: tAdmin("applications") },
          { href: `/${locale}/admin/users`, label: tAdmin("users") },
          { href: `/${locale}/admin/events`, label: tAdmin("allEvents") },
        ]
      : []),
  ]

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent",
            pathname === link.href ? "bg-accent font-medium" : "text-muted-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
