import type { Metadata } from "next";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "../globals.css";
import { Providers } from "../providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { UserSync } from "@/components/UserSync";
import { AdminNavLink } from "@/components/AdminNavLink";
import { DashboardLink } from "@/components/DashboardLink";
import { Toaster } from "@/components/ui/toaster";
import { HomeButton } from "@/components/HomeButton";
import { SiteTitle } from "@/components/SiteTitle";
import { MobileTitle } from "@/components/MobileTitle";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "La Huella del Caminante",
  description: "Eventos de música argentina en Berlín",
};

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("navigation");
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-screen flex-col`} suppressHydrationWarning>
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {/* UserSync component to synchronize users during development */}
            <UserSync />
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <header className="flex flex-col">
                <div className="flex h-16 items-center justify-between p-4">
                  <div className="flex items-center">
                    <HomeButton />
                    <SiteTitle />
                  </div>
                  <div className="flex gap-4">
                    <SignedOut>
                      <Link href="/sign-in">
                        <Button variant="outline">Iniciar Sesión</Button>
                      </Link>
                      <Link href="/sign-up">
                        <Button>{t("signUp")}</Button>
                      </Link>
                    </SignedOut>
                    <SignedIn>
                      {/* Admin Navigation Link - Only visible for administrators */}
                      <AdminNavLink />
                      {/* Dashboard link with pending user modal */}
                      <DashboardLink />
                      <UserButton />
                    </SignedIn>
                  </div>
                </div>

                {/* Mobile title - Only visible on small screens */}
                <MobileTitle />
              </header>
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster />
            </ThemeProvider>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
