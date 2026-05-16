import { getCurrentUser, isAdmin } from "@/services/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { triggerApplicationApproved } from "@/lib/trigger"

/** Schema reducido — el body solo trae el status nuevo. El email y
 * name del aplicante se leen del row del DB (no del body) para defensa
 * contra falsificación: un admin malicioso con credenciales válidas no
 * podría aprobar una Application apuntando email/name a otra cuenta. */
const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
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

  // Los 3 writes (application + user role + userProfile status) van en
  // una transacción para que el approve sea atómico: si falla la conexión
  // a mitad, no quedamos con Application APPROVED pero User sin promover
  // (caso silencioso donde el applicant ve "fuiste aprobado" en el mail
  // pero al loguearse sigue redirigido a `/user-pending`).
  //
  // El trigger del email queda AFUERA de la transacción a propósito:
  //  - No debe bloquear el commit (Resend roundtrip ~200-400ms).
  //  - Un fallo de Resend no debe rollbackear la promoción.
  const { application, userMatched } = await prisma.$transaction(
    async (tx) => {
      const application = await tx.application.update({
        where: { id },
        data: { status: result.data.status },
      })

      let userMatched = 0
      if (result.data.status === "APPROVED") {
        // Si el aplicante ya tiene cuenta, bump role + UserProfile.status.
        // Si todavía no la tiene (caso anónimo via email-de-aprobación),
        // `updateMany` matchea 0 filas — el hook `user.create.after`
        // detectará la Application APPROVED cuando se registre.
        //
        // `role: { not: "admin" }` excluye al founder en el caso edge
        // donde aplica con su mismo email — no degradarlo a creator.
        const userResult = await tx.user.updateMany({
          where: { email: application.email, role: { not: "admin" } },
          data: { role: "creator" },
        })
        await tx.userProfile.updateMany({
          where: { user: { email: application.email } },
          data: { status: "ACTIVE" },
        })
        userMatched = userResult.count
      }

      return { application, userMatched }
    }
  )

  if (result.data.status === "APPROVED") {
    // Log estructurado para distinguir "promoví a user existente" de
    // "no había a quién promover, esperando signup". Sin esto no hay
    // forma operacional de detectar applicants que se aprobaron pero
    // nunca volvieron a registrarse.
    console.info("application_approved", {
      id: application.id,
      email: application.email,
      userMatched: userMatched > 0,
    })

    triggerApplicationApproved({
      email: application.email,
      name: application.name,
    }).catch(() => {})
  }

  return NextResponse.json({ data: { success: true } })
}
