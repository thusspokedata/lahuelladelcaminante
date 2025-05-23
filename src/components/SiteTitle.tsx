"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteTitle() {
  const pathname = usePathname();

  // Check if we're on the homepage (including localized routes like /en, /es, /de)
  const isHomePage = pathname === "/" || pathname.match(/^\/[a-z]{2}$/);

  if (!isHomePage) {
    return null;
  }

  return (
    <Link href="/" className="ml-2 hidden flex-col md:flex">
      <h1 className="text-xl leading-tight font-bold">La Huella del Caminante</h1>
      <p className="text-muted-foreground text-sm">Música Argentina en Berlín</p>
    </Link>
  );
}
