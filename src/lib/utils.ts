import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { prisma } from "./prisma"

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

export async function generateUniqueSlug(
  base: string,
  model: "event" | "artist"
): Promise<string> {
  const slug = slugify(base)
  const existing = await (prisma[model] as { findUnique: (args: { where: { slug: string } }) => Promise<unknown> }).findUnique({ where: { slug } })
  if (!existing) return slug
  const similar = await (prisma[model] as { findMany: (args: { where: { slug: { startsWith: string } }; select: { slug: boolean } }) => Promise<{ slug: string }[]> }).findMany({
    where: { slug: { startsWith: slug } },
    select: { slug: true },
  })
  const max = similar.reduce((n: number, { slug: s }: { slug: string }) => {
    const match = s.match(/-(\d+)$/)
    return match ? Math.max(n, parseInt(match[1])) : n
  }, 1)
  return `${slug}-${max + 1}`
}

export function formatDate(date: Date, locale: string): string {
  const localeMap: Record<string, string> = { es: "es-ES", en: "en-US", de: "de-DE" }
  return new Intl.DateTimeFormat(localeMap[locale] ?? "es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}
