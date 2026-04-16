import "server-only"

import { unstable_cache, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { generateUniqueSlug } from "@/lib/utils"
import { deleteImages } from "./cloudinary"

export interface ArtistSummary {
  id: string
  name: string
  slug: string
  origin: string | null
  genres: string[]
  coverImage: string | null
}

export interface ArtistDetail extends ArtistSummary {
  bio: string | null
  socialMedia: unknown
  images: { id: string; url: string; alt: string | null; publicId: string }[]
}

export interface CreateArtistInput {
  name: string
  bio?: string
  origin?: string
  genres?: string[]
  socialMedia?: {
    instagram?: string
    spotify?: string
    youtube?: string
    tiktok?: string
    website?: string
  }
  images?: { url: string; alt?: string; publicId: string }[]
}

export type UpdateArtistInput = Partial<CreateArtistInput>

function mapToSummary(artist: {
  id: string
  name: string
  slug: string
  origin: string | null
  genres: string[]
  images: { url: string }[]
}): ArtistSummary {
  return {
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    origin: artist.origin,
    genres: artist.genres,
    coverImage: artist.images[0]?.url ?? null,
  }
}

const artistInclude = {
  images: { select: { url: true } },
}

export const getAllArtists = unstable_cache(
  async (search?: string): Promise<ArtistSummary[]> => {
    const artists = await prisma.artist.findMany({
      where: search
        ? { name: { contains: search, mode: "insensitive" } }
        : undefined,
      include: artistInclude,
      orderBy: { name: "asc" },
    })
    return artists.map(mapToSummary)
  },
  ["all-artists"],
  { revalidate: 600, tags: ["artists"] }
)

export async function getArtistBySlug(slug: string): Promise<ArtistDetail | null> {
  const artist = await prisma.artist.findUnique({
    where: { slug },
    include: {
      images: { select: { id: true, url: true, alt: true, publicId: true } },
    },
  })
  if (!artist) return null
  return {
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    origin: artist.origin,
    genres: artist.genres,
    coverImage: artist.images[0]?.url ?? null,
    bio: artist.bio,
    socialMedia: artist.socialMedia,
    images: artist.images,
  }
}

export async function getArtistsByUser(userId: string): Promise<ArtistSummary[]> {
  const artists = await prisma.artist.findMany({
    where: { userId },
    include: artistInclude,
    orderBy: { name: "asc" },
  })
  return artists.map(mapToSummary)
}

export async function createArtist(
  data: CreateArtistInput,
  userId: string
) {
  const slug = await generateUniqueSlug(data.name, "artist")

  const artist = await prisma.artist.create({
    data: {
      name: data.name,
      slug,
      bio: data.bio,
      origin: data.origin,
      genres: data.genres ?? [],
      socialMedia: data.socialMedia,
      userId,
      images: data.images?.length
        ? { create: data.images.map((img) => ({ url: img.url, alt: img.alt, publicId: img.publicId })) }
        : undefined,
    },
  })

  revalidateTag("artists", {})
  return artist
}

export async function updateArtist(id: string, data: UpdateArtistInput) {
  const artist = await prisma.artist.update({
    where: { id },
    data: {
      ...(data.name ? { name: data.name } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.origin !== undefined ? { origin: data.origin } : {}),
      ...(data.genres ? { genres: data.genres } : {}),
      ...(data.socialMedia !== undefined ? { socialMedia: data.socialMedia } : {}),
    },
  })

  revalidateTag("artists", {})
  return artist
}

export async function deleteArtist(id: string): Promise<void> {
  const images = await prisma.image.findMany({
    where: { artistId: id },
    select: { publicId: true },
  })

  if (images.length > 0) {
    await deleteImages(images.map((img: { publicId: string }) => img.publicId))
  }

  await prisma.artist.delete({ where: { id } })
  revalidateTag("artists", {})
}
