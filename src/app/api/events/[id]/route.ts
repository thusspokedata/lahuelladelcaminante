import { getCurrentUser, canEditEvent, isAdmin } from "@/services/auth"
import { softDeleteEvent, hardDeleteEvent, updateEvent } from "@/services/events"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().min(1).optional(),
  address: z.string().optional(),
  organizer: z.string().optional(),
  genre: z.string().optional(),
  time: z.string().optional(),
  price: z.string().optional(),
  artistId: z.string().optional(),
  dates: z.array(z.string().datetime()).optional(),
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

  const canEdit = await canEditEvent(id)
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
  }

  const body = await request.json()
  const result = updateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation error", code: "VALIDATION_ERROR", issues: result.error.issues },
      { status: 400 }
    )
  }

  const { dates, artistId, ...rest } = result.data
  await updateEvent(id, {
    ...rest,
    // Pass null explicitly to clear the relation when empty string sent
    artistId: artistId || null,
    dates: dates?.map((d) => new Date(d)),
  })

  return NextResponse.json({ data: { success: true } })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const hard = searchParams.get("hard") === "true"

  if (hard && !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
  }

  const canEdit = await canEditEvent(id)
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
  }

  if (hard) {
    await hardDeleteEvent(id)
  } else {
    await softDeleteEvent(id)
  }

  return NextResponse.json({ data: { success: true } })
}
