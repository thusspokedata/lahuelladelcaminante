import "server-only"

import { prisma } from "./prisma"
import { slugify } from "./utils"

type SlugModel = {
  findUnique: (args: { where: { slug: string } }) => Promise<unknown>
  findMany: (args: { where: { slug: { startsWith: string } }; select: { slug: boolean } }) => Promise<{ slug: string }[]>
}

export async function generateUniqueSlug(
  base: string,
  model: "event" | "artist" | "userProfile"
): Promise<string> {
  const slug = slugify(base)
  const delegate = prisma[model] as unknown as SlugModel
  const existing = await delegate.findUnique({ where: { slug } })
  if (!existing) return slug
  const similar = await delegate.findMany({
    where: { slug: { startsWith: slug } },
    select: { slug: true },
  })
  const max = similar.reduce((n: number, { slug: s }: { slug: string }) => {
    const match = s.match(/-(\d+)$/)
    return match ? Math.max(n, parseInt(match[1])) : n
  }, 1)
  return `${slug}-${max + 1}`
}
