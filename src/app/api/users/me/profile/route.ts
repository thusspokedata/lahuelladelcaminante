import { NextResponse } from "next/server"
import { z } from "zod"
import { requireActive } from "@/services/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { revalidateTag } from "next/cache"

const socialMediaSchema = z.object({
  instagram: z.string().trim().min(1).max(64).optional(),
  website: z.string().trim().url().max(256).optional(),
  other: z.object({
    label: z.string().trim().min(1).max(48),
    url: z.string().trim().url().max(256),
  }).optional(),
}).strict()

const bodySchema = z.object({
  bio: z.string().trim().max(500).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  socialMedia: socialMediaSchema.nullable().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "slug debe ser kebab-case (a-z, 0-9, guiones)")
    .optional(),
}).strict()

export async function PATCH(req: Request) {
  const { user } = await requireActive("es")
  let parsed
  try {
    const body = await req.json()
    parsed = bodySchema.parse(body)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof z.ZodError ? e.flatten() : "invalid_body" },
      { status: 400 },
    )
  }

  // If slug change requested, check uniqueness (Prisma's unique constraint
  // would also catch it but we want a friendly 409 with the right payload).
  if (parsed.slug !== undefined) {
    const collision = await prisma.userProfile.findUnique({
      where: { slug: parsed.slug },
      select: { userId: true },
    })
    if (collision && collision.userId !== user.id) {
      return NextResponse.json({ error: "slug_collision" }, { status: 409 })
    }
  }

  // Strip Instagram leading @ if present.
  const normalized: typeof parsed = { ...parsed }
  if (parsed.socialMedia?.instagram) {
    normalized.socialMedia = {
      ...parsed.socialMedia,
      instagram: parsed.socialMedia.instagram.replace(/^@/, ""),
    }
  }

  const profile = await prisma.userProfile.update({
    where: { userId: user.id },
    data: {
      ...(normalized.bio !== undefined && { bio: normalized.bio }),
      ...(normalized.city !== undefined && { city: normalized.city }),
      ...(normalized.socialMedia !== undefined && {
        socialMedia: normalized.socialMedia === null
          ? Prisma.JsonNull
          : normalized.socialMedia,
      }),
      ...(normalized.slug !== undefined && { slug: normalized.slug }),
    },
  })

  // Invalidate creator caches (slug-keyed and the lists by-creator).
  revalidateTag("creators", {})

  return NextResponse.json({ data: { profile } })
}
