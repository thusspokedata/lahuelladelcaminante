import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

export const locales = ["es", "de"];
export const defaultLocale = "es";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale || defaultLocale;
  if (!locales.includes(resolvedLocale)) {
    notFound();
  }

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default,
  };
});
