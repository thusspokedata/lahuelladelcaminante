import { getCurrentUser } from "@/services/auth"
import { deleteImage } from "@/services/cloudinary"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  publicId: z.string().min(1),
})

export async function DELETE(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }

  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation error", code: "VALIDATION_ERROR", issues: result.error.issues },
      { status: 400 }
    )
  }

  await deleteImage(result.data.publicId)
  return NextResponse.json({ data: { success: true } })
}
