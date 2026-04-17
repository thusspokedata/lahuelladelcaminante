import { getTranslations } from "next-intl/server"
import { notFound, redirect } from "next/navigation"
import { requireActive, canEditArtist } from "@/services/auth"
import { prisma } from "@/lib/prisma"
import { ArtistForm } from "@/components/artists/ArtistForm"

export default async function EditArtistPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  await requireActive(locale)
  const tForms = await getTranslations({ locale, namespace: "forms" })

  const canEdit = await canEditArtist(id)
  if (!canEdit) redirect(`/${locale}/dashboard`)

  const artistData = await prisma.artist.findUnique({
    where: { id },
    include: { images: { select: { id: true, url: true, alt: true, publicId: true } } },
  })
  if (!artistData) notFound()

  const artist = {
    id: artistData.id,
    name: artistData.name,
    slug: artistData.slug,
    origin: artistData.origin,
    genres: artistData.genres,
    coverImage: artistData.images[0]?.url ?? null,
    bio: artistData.bio,
    socialMedia: artistData.socialMedia,
    images: artistData.images,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{tForms("editArtist")}</h1>
      <ArtistForm artist={artist} artistId={id} />
    </div>
  )
}
