import { getCurrentUser, isAdmin } from "@/services/auth"
import { updateRole } from "@/services/users"
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { generateUniqueSlug } from "@/lib/slugify"

const schema = z.object({
  role: z.enum(["user", "creator", "admin"]),
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

  await updateRole(id, result.data.role)

  // Lazy backfill: si el cambio de rol activa el perfil público, asegurar
  // que existe slug. Mismo patrón que api/apply/[id] al aprobar applications.
  if (result.data.role === "creator" || result.data.role === "admin") {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: id },
      select: { id: true, slug: true, user: { select: { name: true } } },
    })
    if (profile && !profile.slug) {
      const slug = await generateUniqueSlug(profile.user.name, "userProfile")
      await prisma.userProfile.update({
        where: { id: profile.id },
        data: { slug },
      })
    }
  }

  return NextResponse.json({ data: { success: true } })
}
