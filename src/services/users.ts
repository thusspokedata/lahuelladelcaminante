import "server-only"

import { prisma } from "@/lib/prisma"
import { triggerAccountApproved, triggerAccountBlocked } from "@/lib/trigger"

export type UserStatus = "PENDING" | "ACTIVE" | "BLOCKED"

export interface UserWithProfile {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  createdAt: Date
  profile: {
    id: string
    status: UserStatus
    bio: string | null
  } | null
}

function mapUser(user: {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  createdAt: Date
  profile: { id: string; status: string; bio: string | null } | null
}): UserWithProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt,
    profile: user.profile
      ? { ...user.profile, status: user.profile.status as UserStatus }
      : null,
  }
}

export async function getAllUsers(
  filters?: { status?: UserStatus; role?: string }
): Promise<UserWithProfile[]> {
  const users = await prisma.user.findMany({
    where: {
      ...(filters?.role ? { role: filters.role } : {}),
      ...(filters?.status ? { profile: { status: filters.status } } : {}),
    },
    include: {
      profile: {
        select: { id: true, status: true, bio: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return users.map(mapUser)
}

export async function getUserById(id: string): Promise<UserWithProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: { select: { id: true, status: true, bio: true } } },
  })
  if (!user) return null
  return mapUser(user)
}

export async function updateStatus(id: string, status: UserStatus): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, name: true },
  })

  await prisma.userProfile.update({
    where: { userId: id },
    data: { status },
  })

  if (user) {
    if (status === "ACTIVE") {
      await triggerAccountApproved({ email: user.email, name: user.name })
    } else if (status === "BLOCKED") {
      await triggerAccountBlocked({ email: user.email, name: user.name })
    }
  }
}

export async function updateRole(id: string, role: string): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { role },
  })
}
