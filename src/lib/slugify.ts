import "server-only"

import { prisma } from "./prisma"
import { slugify } from "./utils"

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
