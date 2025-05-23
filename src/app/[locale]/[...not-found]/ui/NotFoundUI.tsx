"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type NotFoundUIProps = {
  locale: string;
};

export function NotFoundUI({ locale }: NotFoundUIProps) {

  return (
    <div
      className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center"
      suppressHydrationWarning
    >
      <div className="relative mb-8 flex h-36 w-36 items-center justify-center">
        <div className="bg-muted absolute inset-0 rounded-full opacity-30"></div>
        <span className="relative text-7xl font-bold">404</span>
      </div>

      <h1 className="text-foreground mb-2 text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. The page might have been
        moved or deleted.
      </p>

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
        <Link href={`/${locale}`}>
          <Button size="lg">Go back home</Button>
        </Link>
        <Button variant="outline" size="lg" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  );
}
