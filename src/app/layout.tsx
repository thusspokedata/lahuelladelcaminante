import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
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
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <header className="flex justify-between items-center p-4 h-16">
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
