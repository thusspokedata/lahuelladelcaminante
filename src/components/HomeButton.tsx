"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function HomeButton() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  if (isHomePage) {
    return <div></div>;
  }

  return (
    <Link href="/">
      <Button variant="outline">Volver al Inicio</Button>
    </Link>
  );
}
