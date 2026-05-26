import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/services/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { revalidateTag } from "next/cache"

const socialMediaSchema = z
  .object({
    // El strip del leading `@` se hace dentro del transform del schema,
    // ANTES del min/regex check. Garantiza que `instagram === "@"` (1 char,
    // pasaba el min antes) o `"@   "` se normalicen y luego validen.
    instagram: z
      .string()
      .trim()
      .transform((v) => v.replace(/^@/, ""))
      .pipe(z.string().min(1).max(30).regex(/^[a-zA-Z0-9._]+$/))
      .optional(),
    website: z.string().trim().url().max(256).optional(),
    other: z
      .object({
        label: z.string().trim().min(1).max(48),
        url: z.string().trim().url().max(256),
      })
      .optional(),
  })
  .strict()

const bodySchema = z
  .object({
    bio: z.string().trim().max(500).nullable().optional(),
    city: z.string().trim().max(120).nullable().optional(),
    socialMedia: socialMediaSchema.nullable().optional(),
    // Anclado para prohibir leading/trailing dashes y dashes consecutivos —
    // evita slugs feos como "-juan", "juan-", "ju--an".
    slug: z
      .string()
      .trim()
      .min(2)
      .max(64)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "slug debe ser kebab-case sin guiones al inicio/fin ni dobles guiones",
      )
      .optional(),
  })
  .strict()

export async function PATCH(req: Request) {
  // Patrón canónico de API del repo (ver `api/users/me/route.ts:7-10`):
  // `getCurrentUser()` + 401 explícito en lugar de `requireActive` (que hace
  // redirect, inservible en respuesta a un fetch del browser).
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    )
  }

  // 1) Parse JSON.
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "invalid_json", code: "INVALID_JSON" },
      { status: 400 },
    )
  }

  // 2) Validate shape — `safeParse` patrón del repo (ver `api/contact`,
  // `api/events`, `api/apply`). Error shape unificado:
  // `{error: "validation_error", code: "VALIDATION_ERROR", issues: [...]}`
  const result = bodySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      {
        error: "validation_error",
        code: "VALIDATION_ERROR",
        issues: result.error.issues,
      },
      { status: 400 },
    )
  }
  const parsed = result.data

  // 3) Slug collision pre-check: P2002 del unique constraint atrapa la
  // race condition real, pero el pre-check da un 409 amistoso en el
  // happy path. Si dos PATCHes carrera y uno gana, el otro recibe 500
  // por el P2002 no manejado — aceptable como edge case bajo (chances
  // de colisión simultánea son nulas en práctica).
  if (parsed.slug !== undefined) {
    const collision = await prisma.userProfile.findUnique({
      where: { slug: parsed.slug },
      select: { userId: true },
    })
    if (collision && collision.userId !== user.id) {
      return NextResponse.json(
        { error: "slug_collision", code: "SLUG_COLLISION" },
        { status: 409 },
      )
    }
  }

  const profile = await prisma.userProfile.update({
    where: { userId: user.id },
    data: {
      ...(parsed.bio !== undefined && { bio: parsed.bio }),
      ...(parsed.city !== undefined && { city: parsed.city }),
      ...(parsed.socialMedia !== undefined && {
        // Prisma necesita `Prisma.JsonNull` como sentinel para limpiar
        // un campo `Json?`. Pasar `null` directo falla con type error.
        socialMedia:
          parsed.socialMedia === null ? Prisma.JsonNull : parsed.socialMedia,
      }),
      ...(parsed.slug !== undefined && { slug: parsed.slug }),
    },
  })

  // Si cambia el slug, los bylines de eventos cacheados quedan con el slug
  // viejo hasta su próxima revalidación (5 min). Para cerrar el window,
  // invalidamos también `events` SOLO cuando el slug cambió.
  revalidateTag("creators", {})
  if (parsed.slug !== undefined) {
    revalidateTag("events", {})
  }

  // Shape `{data: profile}` alineado con `api/events:POST` que devuelve el
  // recurso crudo en `data`. El cliente accede via `res.data` directo.
  return NextResponse.json({ data: profile })
}
