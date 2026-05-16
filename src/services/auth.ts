import "server-only"

import { cache } from "react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

/**
 * Roles canónicos del sistema. Alineado con cómo se setea `user.role`
 * en `src/lib/auth.ts` (`"creator"`) y con el enum del endpoint de cambio
 * de rol en `src/app/api/users/[id]/role/route.ts` (`["user", "creator", "admin"]`).
 *
 * Importarlo desde otros archivos en vez de redefinir strings o enums sueltos.
 */
export type Role = "user" | "creator" | "admin"

export function isAdmin(role?: string | null) {
  return role?.toLowerCase() === "admin"
}

export function isCreatorOrAdmin(role?: string | null) {
  const r = role?.toLowerCase()
  return r === "admin" || r === "creator"
}

/**
 * `getSession` y `getUserProfile` están wrappeados con `React.cache()`
 * para dedupe request-scoped: las rutas del dashboard pegan a la cadena
 * `(protected)/layout → dashboard/layout → page`, cada uno llamando a
 * `requireActive` que a su vez llama a estos dos. Sin el dedupe sería
 * 3× session lookup + 3× profile query por request. `cache()` hace que
 * la segunda y tercera llamada con los mismos args reusen el resultado.
 * No afecta semántica de redirects — esos siguen evaluándose en cada
 * caller, solo se reusa la data fetcheada.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

const getUserProfile = cache(async (userId: string) => {
  return prisma.userProfile.findUnique({ where: { userId } })
})

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

export async function requireAuth(locale = "es") {
  const user = await getCurrentUser()
  if (!user) redirect(`/${locale}/sign-in`)
  return user
}

export async function requireActive(locale = "es") {
  const user = await requireAuth(locale)
  const profile = await getUserProfile(user.id)
  if (profile?.status === "PENDING") redirect(`/${locale}/user-pending`)
  if (profile?.status === "BLOCKED") redirect(`/${locale}/user-blocked`)
  return { user, profile }
}

export async function requireRole(role: Exclude<Role, "user">, locale = "es") {
  const { user } = await requireActive(locale)
  const r = user.role?.toLowerCase()
  if (r !== role && r !== "admin") {
    redirect(`/${locale}/dashboard`)
  }
  return user
}

export async function canEditArtist(artistId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  if (user.role?.toLowerCase() === "admin") return true
  const artist = await prisma.artist.findUnique({ where: { id: artistId } })
  return artist?.userId === user.id
}

export async function canEditEvent(eventId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  if (user.role?.toLowerCase() === "admin") return true
  const event = await prisma.event.findUnique({ where: { id: eventId } })
  return event?.createdById === user.id
}
