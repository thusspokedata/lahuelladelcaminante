import { getCurrentUser } from "@/services/auth"
import { prisma } from "@/lib/prisma"
import { deleteImages } from "@/services/cloudinary"
import { NextResponse } from "next/server"

export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Collect all Cloudinary publicIds before deleting DB records
  const [eventImages, artistImages] = await Promise.all([
    prisma.image.findMany({
      where: { event: { createdById: user.id } },
      select: { publicId: true },
    }),
    prisma.image.findMany({
      where: { artist: { userId: user.id } },
      select: { publicId: true },
    }),
  ])

  const publicIds = [
    ...eventImages.map((i) => i.publicId),
    ...artistImages.map((i) => i.publicId),
  ]

  if (publicIds.length > 0) {
    await deleteImages(publicIds).catch(() => {})
  }

  // Delete events (cascades EventDate + Image rows)
  await prisma.event.deleteMany({ where: { createdById: user.id } })

  // Delete artists (cascades Image rows)
  await prisma.artist.deleteMany({ where: { userId: user.id } })

  // Delete the user — schema cascades: Session, Account, UserProfile
  await prisma.user.delete({ where: { id: user.id } })

  return NextResponse.json({ data: { success: true } })
}
