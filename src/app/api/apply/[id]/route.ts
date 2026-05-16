import { getCurrentUser, isAdmin } from "@/services/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { triggerApplicationApproved } from "@/lib/trigger"

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

  // Update + read en una sola operación. Usamos el email/name del row
  // del DB (no del body del request) como fuente de verdad para el
  // matching del User y para el trigger del email — no confiamos en
  // strings que vienen del cliente para identificar al user.
  const application = await prisma.application.update({
    where: { id },
    data: { status: result.data.status },
  })

  if (result.data.status === "approved") {
    // Si el aplicante ya tiene cuenta (caso usual: aplicó después de
    // signup), bump su UserProfile.status a ACTIVE y role a creator
    // para destrabar el panel. Si todavía no tiene cuenta (aplicó como
    // anónimo via email-de-aprobación), el hook `user.create.after`
    // detectará la Application aprobada cuando se registre y le dará
    // ACTIVE + creator inmediato.
    //
    // `updateMany` con `where` por email permite el caso "0 matches" sin
    // tirar (a diferencia de `update` que rechaza si no encuentra). El
    // role bump excluye admins por defensa — un admin con la misma email
    // (caso edge: founder aplicando como creator) no debería degradar a
    // creator.
    await prisma.user.updateMany({
      where: { email: application.email, role: { not: "admin" } },
      data: { role: "creator" },
    })
    await prisma.userProfile.updateMany({
      where: { user: { email: application.email } },
      data: { status: "ACTIVE" },
    })

    triggerApplicationApproved({
      email: application.email,
      name: application.name,
    }).catch(() => {})
  }

  return NextResponse.json({ data: { success: true } })
}
