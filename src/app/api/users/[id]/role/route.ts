import { getCurrentUser } from "@/services/auth"
import { updateRole } from "@/services/users"
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

  if (user.role !== "admin" && user.role !== "ADMIN") {
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
  return NextResponse.json({ data: { success: true } })
}
