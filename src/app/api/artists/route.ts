import { getCurrentUser, isArtistOrAdmin } from "@/services/auth"
import { getAllArtists, createArtist } from "@/services/artists"
import { NextResponse } from "next/server"
import { z } from "zod"

const createArtistSchema = z.object({
  name: z.string().min(1),
  bio: z.string().optional(),
  origin: z.string().optional(),
  genres: z.array(z.string()).optional(),
  socialMedia: z
    .object({
      instagram: z.string().optional(),
      spotify: z.string().optional(),
      youtube: z.string().optional(),
      tiktok: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().optional(),
        publicId: z.string(),
      })
    )
    .optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") ?? undefined
  const artists = await getAllArtists(search)
  return NextResponse.json({ data: artists })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  if (!isArtistOrAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
  }

  const body = await request.json()
  const result = createArtistSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation error", code: "VALIDATION_ERROR", issues: result.error.issues },
      { status: 400 }
    )
  }

  const artist = await createArtist(result.data, user.id)
  return NextResponse.json({ data: artist }, { status: 201 })
}
