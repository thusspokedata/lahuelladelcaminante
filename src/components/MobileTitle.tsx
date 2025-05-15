"use client";

import { usePathname } from "next/navigation";

export function MobileTitle() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  if (!isHomePage) {
    return null;
  }

  return (
    <div className="pb-4 text-center md:hidden">
      <h1 className="text-xl font-bold">La Huella del Caminante</h1>
      <p className="text-muted-foreground text-sm">Música Argentina en Berlín</p>
    </div>
  );
}
