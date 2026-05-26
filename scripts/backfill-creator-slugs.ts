/**
 * One-off backfill: assigns `UserProfile.slug` to every user with
 * role `creator` or `admin` whose slug is currently NULL.
 *
 * Run locally against dev Neon first:
 *   npx tsx scripts/backfill-creator-slugs.ts
 *
 * After merge + production deploy, the user runs the equivalent
 * against prod Neon (the project's deploy gotcha covers manual
 * Prisma migration apply for prod).
 *
 * Note: src/lib/slugify.ts carries `import "server-only"` which throws
 * outside the Next.js server context, so the slug generation is inlined
 * here using the same logic. The uniqueness check queries UserProfile
 * directly (same logic as generateUniqueSlug but for the userProfile model).
 */
import { prisma } from "../src/lib/prisma"
import { slugify } from "../src/lib/utils"

async function generateUniqueSlug(base: string): Promise<string> {
  const slug = slugify(base)
  const existing = await prisma.userProfile.findUnique({ where: { slug } })
  if (!existing) return slug
  const similar = await prisma.userProfile.findMany({
    where: { slug: { startsWith: slug } },
    select: { slug: true },
  })
  const max = similar.reduce((n: number, row: { slug: string | null }) => {
    if (!row.slug) return n
    const match = row.slug.match(/-(\d+)$/)
    return match ? Math.max(n, parseInt(match[1])) : n
  }, 1)
  return `${slug}-${max + 1}`
}

async function main() {
  const candidates = await prisma.user.findMany({
    where: {
      role: { in: ["creator", "admin"] },
      profile: { slug: null },
    },
    select: { id: true, name: true, profile: { select: { id: true } } },
  })

  console.log(`Found ${candidates.length} users needing slug backfill.`)

  for (const u of candidates) {
    if (!u.profile) {
      console.warn(`  - SKIP ${u.id} (no UserProfile row)`)
      continue
    }
    const slug = await generateUniqueSlug(u.name)
    await prisma.userProfile.update({
      where: { id: u.profile.id },
      data: { slug },
    })
    console.log(`  - ${u.name} → ${slug}`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
