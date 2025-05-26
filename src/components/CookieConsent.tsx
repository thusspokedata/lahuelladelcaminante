"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export default function CookieConsent() {
  const [accepted, setAccepted] = useState(true); // Default to true to prevent flash
  const locale = useLocale();
  const t = useTranslations("cookies");
  const footerT = useTranslations("footer");

  useEffect(() => {
    // Check localStorage to see if user has already consented
    const cookieConsent = localStorage.getItem("cookie-consent");
    if (cookieConsent === null) {
      setAccepted(false); // Only show banner if user hasn't consented
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setAccepted(true);
  };

  if (accepted) {
    return null;
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 bg-black/80 p-4 text-white">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex-1">
          <p>
            {t("message")}{" "}
            <Link href={`/${locale}/legal/privacy-policy`} className="underline">
              {footerT("privacy")}
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={acceptCookies}
            className="bg-primary hover:bg-primary/80 rounded px-4 py-2 text-white"
          >
            {t("accept")}
          </button>
          <button 
            onClick={() => setAccepted(true)} 
            className="text-white" 
            aria-label={t("close")}
          >
            <X size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
