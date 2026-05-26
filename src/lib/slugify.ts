import "server-only"

import { prisma } from "./prisma"
import { slugify } from "./utils"

type SlugModel = {
  findUnique: (args: { where: { slug: string } }) => Promise<unknown>
  // `UserProfile.slug` es nullable en el schema (a diferencia de Event/Artist
  // que son NOT NULL), así que el tipo del retorno tiene que aceptar `null`.
  // El reducer abajo filtra los nulls — el filtro `startsWith` de Postgres
  // los excluye en la práctica, pero el contract de TS debe matchear.
  findMany: (args: { where: { slug: { startsWith: string } }; select: { slug: boolean } }) => Promise<{ slug: string | null }[]>
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
  const max = similar.reduce((n: number, { slug: s }: { slug: string | null }) => {
    if (!s) return n
    const match = s.match(/-(\d+)$/)
    return match ? Math.max(n, parseInt(match[1])) : n
  }, 1)
  return `${slug}-${max + 1}`
}
