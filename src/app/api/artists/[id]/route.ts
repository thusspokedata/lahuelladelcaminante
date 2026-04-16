import { getCurrentUser, canEditArtist } from "@/services/auth"
import { updateArtist, deleteArtist } from "@/services/artists"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateArtistSchema = z.object({
  name: z.string().min(1).optional(),
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
  keepImageIds: z.array(z.string()).optional(),
  newImages: z
    .array(z.object({ url: z.string().url(), alt: z.string().optional(), publicId: z.string() }))
    .optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  const canEdit = await canEditArtist(id)
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
  }

  const body = await request.json()
  const result = updateArtistSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation error", code: "VALIDATION_ERROR", issues: result.error.issues },
      { status: 400 }
    )
  }

  const artist = await updateArtist(id, result.data)
  return NextResponse.json({ data: artist })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  const canEdit = await canEditArtist(id)
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
  }

  await deleteArtist(id)
  return NextResponse.json({ data: { success: true } })
}
