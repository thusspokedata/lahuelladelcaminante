import { getCurrentUser, canEditEvent } from "@/services/auth"
import { softDeleteEvent, hardDeleteEvent } from "@/services/events"
import { NextResponse } from "next/server"

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

  if (hard && user.role !== "admin" && user.role !== "ADMIN") {
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
