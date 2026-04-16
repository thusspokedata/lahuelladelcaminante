import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

export function formatDate(date: Date | string | null | undefined, locale: string): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""
  const localeMap: Record<string, string> = { es: "es-ES", en: "en-US", de: "de-DE" }
  return new Intl.DateTimeFormat(localeMap[locale] ?? "es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d)
}
