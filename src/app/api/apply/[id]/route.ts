import { getCurrentUser, isAdmin } from "@/services/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  status: z.enum(["approved", "rejected"]),
  email: z.string().email(),
  name: z.string(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: "Validation error" }, { status: 400 })
  }

  await prisma.application.update({
    where: { id },
    data: { status: result.data.status },
  })

  return NextResponse.json({ data: { success: true } })
}
