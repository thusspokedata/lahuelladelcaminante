import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, defaultLocale } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale || defaultLocale;
  if (!locales.includes(resolvedLocale)) {
    notFound();
  }
  console.log("request.ts - resolvedLocale:", resolvedLocale);
  const messages = (await import(`../../messages/${resolvedLocale}.json`)).default;
  console.log("request.ts - messages:", messages);
  return {
    locale: resolvedLocale,
    messages,
  };
});
