import { getCurrentUser, isAdmin } from "@/services/auth"
import { restoreEvent } from "@/services/events"
import { NextResponse } from "next/server"

export async function POST(
  _request: Request,
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

  await restoreEvent(id)
  return NextResponse.json({ data: { success: true } })
}
