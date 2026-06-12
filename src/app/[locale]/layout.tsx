import type { Metadata } from "next"
import Script from "next/script"
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import { Toaster } from "@/components/ui/sonner"
import CookieNotice from "@/components/legal/CookieNotice"
import "../globals.css"

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
})

const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "La Huella del Caminante — Música Latinoamericana en Berlín",
  description: "Portal de eventos de música latinoamericana en Berlín",
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as "es" | "en" | "de")) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`dark ${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg-page text-fg-primary">
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieNotice />
          <Toaster />
        </NextIntlClientProvider>
        {/* Umami analytics (self-hosted, cookieless — no requiere consent).
            Doble gate de BUILD TIME: la env var (sin ella no se renderiza) y
            NODE_ENV === "production" — necesario porque el deploy buildea
            LOCAL (deploy.sh) y la var vive en el .env.local del dev, así que
            sin este check `npm run dev` también trackearía. `data-domains`
            es el tercer cinturón: el script solo emite desde el dominio real. */}
        {process.env.NODE_ENV === "production" &&
        process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? (
          <Script
            src="https://umami.lahuelladelcaminante.de/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            data-domains="lahuelladelcaminante.de,www.lahuelladelcaminante.de"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  )
}
