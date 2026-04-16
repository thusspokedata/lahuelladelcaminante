import { getCurrentUser, isAdmin } from "@/services/auth"
import { updateStatus } from "@/services/users"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "BLOCKED"]),
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

  await updateStatus(id, result.data.status)
  return NextResponse.json({ data: { success: true } })
}
