"use client";

import {
  IconBrandInstagram,
  IconBrandFacebook,
  IconMail,
  IconBrandTiktok,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();

  // Email obfuscation to prevent spam bots
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Build email on client-side to make it harder for bots to capture
    const username = "info";
    const domain = "lahuelladelcaminante.de";
    setEmail(`${username}@${domain}`);
  }, []);

  return (
    <footer className="bg-background mt-16 border-t py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h3 className="text-lg font-semibold">La Huella del Caminante</h3>
            <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a
              href="https://instagram.com/lahuelladelcaminante.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <IconBrandInstagram size={20} />
              <span className="sr-only md:not-sr-only md:text-sm">Instagram</span>
            </a>

            <a
              href="https://facebook.com/lahuelladelcaminante.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <IconBrandFacebook size={20} />
              <span className="sr-only md:not-sr-only md:text-sm">Facebook</span>
            </a>

            <a
              href="https://tiktok.com/@lahuelladelcaminante.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              <IconBrandTiktok size={20} />
              <span className="sr-only md:not-sr-only md:text-sm">TikTok</span>
            </a>

            {/* Email is only generated when JavaScript is active, making it harder for bots to capture */}
            <button
              onClick={() => email && (window.location.href = `mailto:${email}`)}
              className="text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              aria-label="Send email"
            >
              <IconMail size={20} />
              <span className="sr-only md:not-sr-only md:text-sm">{t("contact")}</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-4 text-xs text-muted-foreground">
          <Link href={`/${locale}/legal/impressum`} className="hover:text-primary hover:underline">
            {t("impressum")}
          </Link>
          <Link href={`/${locale}/legal/privacy-policy`} className="hover:text-primary hover:underline">
            {t("privacy")}
          </Link>
        </div>
        
        <div className="text-muted-foreground mt-4 text-center text-xs">
          © {new Date().getFullYear()} La Huella del Caminante. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
