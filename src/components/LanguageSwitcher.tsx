"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import Image from "next/image";

const languages = [
  { name: "Español", locale: "es", flag: "/images/flags/es.svg" },
  { name: "English", locale: "en", flag: "/images/flags/en.svg" },
  { name: "Deutsch", locale: "de", flag: "/images/flags/de.svg" },
];

// Extract locale codes for reuse
const localeCodes = languages.map((lang) => lang.locale);

export default function LanguageSwitcher() {
  const t = useTranslations("languageSwitcher");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const switchToLocale = (nextLocale: string) => {
    // Use window.location for direct navigation
    const currentPath = window.location.pathname;
    const segments = currentPath.split("/").filter(Boolean);

    // Filter out any segments that match our locales
    const pathWithoutLocales = segments
      .filter((segment) => !localeCodes.includes(segment))
      .join("/");

    // Construct new path with target locale
    const newPath = `/${nextLocale}${pathWithoutLocales ? `/${pathWithoutLocales}` : ""}`;

    // Navigate using window.location
    window.location.href = newPath;
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("switchLanguage")}>
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.locale}
            disabled={locale === language.locale}
            className={locale === language.locale ? "bg-accent text-accent-foreground" : ""}
            onClick={() => switchToLocale(language.locale)}
          >
            <div className="flex items-center gap-2">
              <div className="relative h-4 w-6 overflow-hidden rounded-sm">
                <Image
                  src={language.flag}
                  alt={`${language.name} flag`}
                  fill
                  className="object-cover"
                />
              </div>
              <span>{language.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
