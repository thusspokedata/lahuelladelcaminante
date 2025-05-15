"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteTitle() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  if (!isHomePage) {
    return null;
  }

  return (
    <Link href="/" className="ml-2 flex flex-col">
      <h1 className="text-xl leading-tight font-bold">La Huella del Caminante</h1>
      <p className="text-muted-foreground text-sm">Música Argentina en Berlín</p>
    </Link>
  );
}
