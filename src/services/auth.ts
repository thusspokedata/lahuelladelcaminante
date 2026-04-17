import "server-only"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export function isAdmin(role?: string | null) {
  return role?.toLowerCase() === "admin"
}

export function isCreatorOrAdmin(role?: string | null) {
  const r = role?.toLowerCase()
  return r === "admin" || r === "creator"
}

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

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
  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  })
  if (profile?.status === "PENDING") redirect(`/${locale}/user-pending`)
  if (profile?.status === "BLOCKED") redirect(`/${locale}/user-blocked`)
  return { user, profile }
}

export async function requireRole(role: "ADMIN" | "ARTIST", locale = "es") {
  const { user } = await requireActive(locale)
  const r = user.role?.toLowerCase()
  const required = role.toLowerCase()
  if (r !== required && r !== "admin") {
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
