"use client";

import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import UserProvider from "@/components/UserProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <ClerkProvider
        appearance={{
          baseTheme: resolvedTheme === "dark" ? dark : undefined,
        }}
      >
        <UserProvider>{children}</UserProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}
