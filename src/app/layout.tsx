import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "La Huella del Caminante",
  description: "Eventos de música argentina en Berlín",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Using suppressHydrationWarning to prevent errors from browser extensions (like password managers)
    // that might modify the DOM before React hydration
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <header className="flex h-16 items-center justify-between p-4">
              <Link href="/">
                <Button variant="outline">Volver al Inicio</Button>
              </Link>
              <div className="flex gap-4">
                <SignedOut>
                  <Link href="/sign-in">
                    <Button variant="outline">Iniciar Sesión</Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button>Registrarse</Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </header>
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
