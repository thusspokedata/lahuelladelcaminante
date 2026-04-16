import "server-only"

import { unstable_cache, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { generateUniqueSlug } from "@/lib/utils"
import { deleteImages } from "./cloudinary"

export interface EventSummary {
  id: string
  title: string
  slug: string
  location: string
  genre: string | null
  dates: Date[]
  artistName: string | null
  coverImage: string | null
}

export interface EventDetail extends EventSummary {
  description: string | null
  organizer: string | null
  time: string | null
  price: string | null
  images: { id: string; url: string; alt: string | null; publicId: string }[]
  artist: {
    id: string
    name: string
    slug: string
    bio: string | null
    origin: string | null
    genres: string[]
    socialMedia: unknown
  } | null
}

export interface CreateEventInput {
  title: string
  description?: string
  location: string
  organizer?: string
  genre?: string
  time?: string
  price?: string
  artistId?: string
  dates: Date[]
  images?: { url: string; alt?: string; publicId: string }[]
}

function mapToSummary(event: {
  id: string
  title: string
  slug: string
  location: string
  genre: string | null
  dates: { date: Date }[]
  artist: { name: string } | null
  images: { url: string }[]
}): EventSummary {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    location: event.location,
    genre: event.genre,
    dates: event.dates.map((d: { date: Date }) => d.date),
    artistName: event.artist?.name ?? null,
    coverImage: event.images[0]?.url ?? null,
  }
}

const eventInclude = {
  dates: { orderBy: { date: "asc" as const } },
  artist: { select: { name: true } },
  images: { select: { url: true } },
}

export const getUpcomingEvents = unstable_cache(
  async (filters?: { genre?: string }): Promise<EventSummary[]> => {
    const events = await prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: new Date() } } },
        ...(filters?.genre ? { genre: filters.genre } : {}),
      },
      include: eventInclude,
      orderBy: { createdAt: "desc" },
    })
    return events.map(mapToSummary)
  },
  ["upcoming-events"],
  { revalidate: 300, tags: ["events"] }
)

export const getPastEvents = unstable_cache(
  async (): Promise<EventSummary[]> => {
    const events = await prisma.event.findMany({
      where: {
        isDeleted: false,
        dates: { every: { date: { lt: new Date() } } },
      },
      include: eventInclude,
      orderBy: { createdAt: "desc" },
    })
    return events.map(mapToSummary)
  },
  ["past-events"],
  { revalidate: 600, tags: ["events"] }
)

export async function getEventBySlug(slug: string): Promise<EventDetail | null> {
  const event = await prisma.event.findUnique({
    where: { slug, isDeleted: false },
    include: {
      dates: { orderBy: { date: "asc" } },
      artist: {
        select: {
          id: true,
          name: true,
          slug: true,
          bio: true,
          origin: true,
          genres: true,
          socialMedia: true,
        },
      },
      images: { select: { id: true, url: true, alt: true, publicId: true } },
    },
  })
  if (!event) return null
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    location: event.location,
    genre: event.genre,
    dates: event.dates.map((d: { date: Date }) => d.date),
    artistName: event.artist?.name ?? null,
    coverImage: event.images[0]?.url ?? null,
    description: event.description,
    organizer: event.organizer,
    time: event.time,
    price: event.price,
    images: event.images,
    artist: event.artist,
  }
}

export async function getEventsByArtist(artistId: string): Promise<EventSummary[]> {
  const events = await prisma.event.findMany({
    where: { artistId, isDeleted: false },
    include: eventInclude,
    orderBy: { createdAt: "desc" },
  })
  return events.map(mapToSummary)
}

export async function getEventsByUser(userId: string): Promise<EventSummary[]> {
  const events = await prisma.event.findMany({
    where: { createdById: userId },
    include: eventInclude,
    orderBy: { createdAt: "desc" },
  })
  return events.map(mapToSummary)
}

export async function getDeletedEvents(): Promise<EventSummary[]> {
  const events = await prisma.event.findMany({
    where: { isDeleted: true },
    include: eventInclude,
    orderBy: { deletedAt: "desc" },
  })
  return events.map(mapToSummary)
}

export async function createEvent(
  data: CreateEventInput,
  userId: string
) {
  const slug = await generateUniqueSlug(data.title, "event")

  const event = await prisma.$transaction(async (tx: typeof prisma) => {
    const created = await tx.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        location: data.location,
        organizer: data.organizer,
        genre: data.genre,
        time: data.time,
        price: data.price,
        artistId: data.artistId,
        createdById: userId,
        dates: {
          create: data.dates.map((date) => ({ date })),
        },
        images: data.images?.length
          ? { create: data.images.map((img) => ({ url: img.url, alt: img.alt, publicId: img.publicId })) }
          : undefined,
      },
    })
    return created
  })

  revalidateTag("events", {})
  return event
}

export async function softDeleteEvent(id: string): Promise<void> {
  await prisma.event.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  })
  revalidateTag("events", {})
}

export async function restoreEvent(id: string): Promise<void> {
  await prisma.event.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
  })
  revalidateTag("events", {})
}

export async function hardDeleteEvent(id: string): Promise<void> {
  const images = await prisma.image.findMany({
    where: { eventId: id },
    select: { publicId: true },
  })

  if (images.length > 0) {
    await deleteImages(images.map((img: { publicId: string }) => img.publicId))
  }

  await prisma.event.delete({ where: { id } })
  revalidateTag("events", {})
}
