import { getCurrentUser, isCreatorOrAdmin } from "@/services/auth"
import { getUpcomingEvents, createEvent } from "@/services/events"
import { NextResponse } from "next/server"
import { z } from "zod"

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().min(1),
  address: z.string().optional(),
  organizer: z.string().optional(),
  genres: z.array(z.string().trim().min(1)).optional(),
  time: z.string().optional(),
  price: z.string().optional(),
  artistId: z.string().optional(),
  dates: z.array(z.string().datetime()).min(1),
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
  const genre = searchParams.get("genre") ?? undefined
  const events = await getUpcomingEvents(genre ? { genre } : undefined)
  return NextResponse.json({ data: events })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  if (!isCreatorOrAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
  }

  const body = await request.json()
  const result = createEventSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation error", code: "VALIDATION_ERROR", issues: result.error.issues },
      { status: 400 }
    )
  }

  const event = await createEvent(
    {
      ...result.data,
      dates: result.data.dates.map((d) => new Date(d)),
    },
    user.id
  )

  return NextResponse.json({ data: event }, { status: 201 })
}
