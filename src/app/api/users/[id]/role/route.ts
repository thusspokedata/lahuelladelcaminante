import { getCurrentUser, isAdmin } from "@/services/auth"
import { updateRole, getUserById } from "@/services/users"
import { triggerArtistWelcome } from "@/lib/trigger"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  role: z.enum(["user", "artist", "admin"]),
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

  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
  }

  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation error", code: "VALIDATION_ERROR", issues: result.error.issues },
      { status: 400 }
    )
  }

  await updateRole(id, result.data.role)

  // Send welcome email when promoted to artist
  if (result.data.role === "artist") {
    const target = await getUserById(id)
    if (target) {
      await triggerArtistWelcome({ email: target.email, name: target.name }).catch(() => {})
    }
  }

  return NextResponse.json({ data: { success: true } })
}
