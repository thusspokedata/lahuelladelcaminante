/**
 * /api/dashboard/scene-events
 *
 * GET  — lista todas las SceneEvents (admin only)
 * POST — crea una SceneEvent (admin only)
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, isAdmin } from "@/services/auth"

const createSceneEventSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  title: z.string().min(1).max(200),
  venue: z.string().max(200).optional(),
  externalUrl: z.string().url().optional().or(z.literal("")),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const events = await prisma.sceneEvent.findMany({
    orderBy: { date: "asc" },
  })

  return NextResponse.json({ data: events })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const result = createSceneEventSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "validation_error", issues: result.error.issues },
      { status: 400 }
    )
  }

  const { date, title, venue, externalUrl } = result.data

  const created = await prisma.sceneEvent.create({
    data: {
      date: new Date(date + "T12:00:00.000Z"),
      title,
      venue: venue || null,
      externalUrl: externalUrl || null,
    },
  })

  return NextResponse.json({ data: created }, { status: 201 })
}
