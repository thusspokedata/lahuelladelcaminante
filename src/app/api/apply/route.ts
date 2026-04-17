import { NextResponse } from "next/server"
import { z } from "zod"
import { triggerApplicationNotification } from "@/lib/trigger"

const schema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  message: z.string().min(10, "Contanos un poco más sobre vos y tus eventos"),
})

export async function POST(request: Request) {
  const body = await request.json()
  const result = schema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { error: "Validation error", issues: result.error.issues },
      { status: 400 }
    )
  }

  try {
    await triggerApplicationNotification(result.data)
    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: "Error sending email" }, { status: 500 })
  }
}
