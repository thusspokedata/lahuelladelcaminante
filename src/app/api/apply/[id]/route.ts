import { getCurrentUser, isAdmin } from "@/services/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
import { triggerApplicationApproved } from "@/lib/trigger"
import { generateUniqueSlug } from "@/lib/slugify"

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
  //
  // Además, leemos el status previo dentro de la transacción para detectar
  // la transición real: solo notificamos en el "salto a APPROVED", no en
  // re-clicks del admin sobre una Application ya aprobada (que de otra
  // manera dispararían un mail duplicado al applicant).
  const { application, userMatched, transitionedToApproved } =
    await prisma.$transaction(async (tx) => {
      const previous = await tx.application.findUnique({
        where: { id },
        select: { status: true },
      })
      if (!previous) {
        throw new Error("application_not_found")
      }

      const application = await tx.application.update({
        where: { id },
        data: { status: result.data.status },
      })

      let userMatched = 0
      if (result.data.status === "APPROVED") {
        // Los bumps del User corren incluso si ya estaba APPROVED — son
        // idempotentes y sirven de "self-heal" si el primer approve falló
        // a mitad antes de la transacción (commits previos al fix).
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

      const transitionedToApproved =
        previous.status !== "APPROVED" &&
        result.data.status === "APPROVED"

      return { application, userMatched, transitionedToApproved }
    })

  // Lazy backfill: el creator necesita slug público para /creators/[slug].
  // El script one-off de Task 1 cubrió users existentes; este path cubre
  // los nuevos. Corre fuera de la transacción porque generateUniqueSlug usa
  // el cliente prisma del módulo — la ventana sin slug es mínima (admin action).
  if (transitionedToApproved) {
    const profileToBackfill = await prisma.userProfile.findFirst({
      where: { user: { email: application.email } },
      select: { id: true, slug: true, user: { select: { name: true } } },
    })
    if (profileToBackfill && !profileToBackfill.slug) {
      const slug = await generateUniqueSlug(profileToBackfill.user.name, "userProfile")
      await prisma.userProfile.update({
        where: { id: profileToBackfill.id },
        data: { slug },
      })
    }
  }

  // Solo notificamos (email + log) en la transición real para evitar
  // duplicados. Si el admin clickea "aprobar" dos veces o vuelve a PATCH
  // sobre una Application ya APPROVED, no se dispara nada.
  if (transitionedToApproved) {
    // Log estructurado SIN PII. Antes incluía `email` crudo — sacado:
    // operacionalmente alcanza con `id` y `userMatched` para correlacionar
    // contra Application; el email del applicante no debe vivir en logs.
    console.info("application_approved", {
      id: application.id,
      userMatched: userMatched > 0,
    })

    triggerApplicationApproved({
      email: application.email,
      name: application.name,
    }).catch(() => {})
  }

  return NextResponse.json({ data: { success: true } })
}
