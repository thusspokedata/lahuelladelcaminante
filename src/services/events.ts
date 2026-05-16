import "server-only"

import { unstable_cache, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { generateUniqueSlug } from "@/lib/slugify"
import { deleteImages } from "./cloudinary"

export interface EventSummary {
  id: string
  title: string
  slug: string
  location: string
  genre: string | null
  time: string | null
  price: string | null
  dates: Date[]
  artistName: string | null
  coverImage: string | null
  coverImagePublicId: string | null
  coverImageAlt: string | null
}

export interface EventDetail extends EventSummary {
  description: string | null
  organizer: string | null
  address: string | null
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
  address?: string
  organizer?: string
  genre?: string
  time?: string
  price?: string
  artistId?: string
  dates: Date[]
  images?: { url: string; alt?: string; publicId: string }[]
}

export interface UpdateEventInput {
  title?: string
  description?: string
  location?: string
  address?: string
  organizer?: string
  genre?: string
  time?: string
  price?: string
  artistId?: string | null
  dates?: Date[]
  /** IDs of existing EventImage rows to KEEP; others will be deleted */
  keepImageIds?: string[]
  /** New images to add */
  newImages?: { url: string; alt?: string; publicId: string }[]
}

function mapToSummary(event: {
  id: string
  title: string
  slug: string
  location: string
  genre: string | null
  time: string | null
  price: string | null
  dates: { date: Date }[]
  artist: { name: string } | null
  images: { url: string; publicId: string; alt: string | null }[]
}): EventSummary {
  const cover = event.images[0] ?? null
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    location: event.location,
    genre: event.genre,
    time: event.time,
    price: event.price,
    dates: event.dates.map((d: { date: Date }) => d.date),
    artistName: event.artist?.name ?? null,
    coverImage: cover?.url ?? null,
    coverImagePublicId: cover?.publicId ?? null,
    coverImageAlt: cover?.alt ?? null,
  }
}

const eventInclude = {
  dates: { orderBy: { date: "asc" as const } },
  artist: { select: { name: true } },
  images: { select: { url: true, publicId: true, alt: true } },
}

/**
 * Eventos activos cuya próxima fecha cae dentro de los próximos `days` días.
 * Usado por la home para decidir el copy del hero (esta semana / mes que
 * viene / lo que viene) sin traer toda la agenda al cliente.
 */
export const getUpcomingEventsWithin = unstable_cache(
  async (days: number, limit?: number): Promise<EventSummary[]> => {
    const now = new Date()
    const until = new Date(now)
    until.setDate(until.getDate() + days)
    const events = await prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: now, lte: until } } },
      },
      include: eventInclude,
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: limit } : {}),
    })
    return events.map(mapToSummary)
  },
  ["upcoming-events-within"],
  { revalidate: 300, tags: ["events"] }
)

/**
 * Próximos 3-N eventos para la sección "Imperdibles" de la home. Por ahora
 * usamos un proxy: los próximos por fecha. TODO: cuando exista un flag
 * `featured` en el modelo Event, filtrar por ese flag aquí.
 */
export const getFeaturedEvents = unstable_cache(
  async (limit = 3): Promise<EventSummary[]> => {
    const events = await prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: new Date() } } },
      },
      include: eventInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
    })
    return events.map(mapToSummary)
  },
  ["featured-events"],
  { revalidate: 300, tags: ["events"] }
)

export interface UpcomingStats {
  shows: number
  artists: number
  cities: number
  dateRange: { from: Date | null; to: Date | null }
}

/**
 * Stats agregadas para el strip de la home: cuántos shows próximos hay,
 * cuántos artistas distintos, cuántas ciudades distintas y el rango de
 * fechas que cubren. Devuelve `dateRange.from/to = null` si no hay eventos.
 */
export const getUpcomingStats = unstable_cache(
  async (): Promise<UpcomingStats> => {
    const now = new Date()
    const events = await prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: now } } },
      },
      select: {
        artistId: true,
        location: true,
        dates: { where: { date: { gte: now } }, select: { date: true } },
      },
    })

    const artists = new Set<string>()
    const cities = new Set<string>()
    const allDates: Date[] = []

    for (const ev of events) {
      if (ev.artistId) artists.add(ev.artistId)
      // Cities derivadas igual que `getActiveCities`: último segmento del
      // string `location` después del último coma.
      const parts = ev.location.split(",").map((s) => s.trim())
      const city = parts[parts.length - 1]
      if (city) cities.add(city)
      for (const d of ev.dates) allDates.push(d.date)
    }

    allDates.sort((a, b) => a.getTime() - b.getTime())

    return {
      shows: events.length,
      artists: artists.size,
      cities: cities.size,
      dateRange: {
        from: allDates[0] ?? null,
        to: allDates[allDates.length - 1] ?? null,
      },
    }
  },
  ["upcoming-stats"],
  { revalidate: 300, tags: ["events"] }
)

export const getUpcomingEvents = unstable_cache(
  async (filters?: { genre?: string; city?: string }): Promise<EventSummary[]> => {
    const events = await prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: new Date() } } },
        ...(filters?.genre ? { genre: filters.genre } : {}),
        ...(filters?.city ? { location: { contains: filters.city, mode: "insensitive" } } : {}),
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
  const cover = event.images[0] ?? null
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    location: event.location,
    genre: event.genre,
    dates: event.dates.map((d: { date: Date }) => d.date),
    artistName: event.artist?.name ?? null,
    coverImage: cover?.url ?? null,
    coverImagePublicId: cover?.publicId ?? null,
    coverImageAlt: cover?.alt ?? null,
    description: event.description,
    organizer: event.organizer,
    address: event.address,
    time: event.time,
    price: event.price,
    images: event.images,
    artist: event.artist,
  }
}

export const getActiveGenres = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        genre: { not: null },
        dates: { some: { date: { gte: new Date() } } },
      },
      select: { genre: true },
      distinct: ["genre"],
      orderBy: { genre: "asc" },
    })
    return rows.map((r) => r.genre as string)
  },
  ["active-genres"],
  { revalidate: 300, tags: ["events"] }
)

export const getActiveCities = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: new Date() } } },
      },
      select: { location: true },
      distinct: ["location"],
      orderBy: { location: "asc" },
    })
    // Extract city: take everything after the last comma (or the whole string)
    const cities = Array.from(
      new Set(
        rows.map((r) => {
          const parts = r.location.split(",").map((s) => s.trim())
          return parts[parts.length - 1]
        })
      )
    ).sort()
    return cities
  },
  ["active-cities"],
  { revalidate: 300, tags: ["events"] }
)

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
    where: { createdById: userId, isDeleted: false },
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

  const event = await prisma.$transaction(async (tx) => {
    const created = await tx.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        location: data.location,
        address: data.address,
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

export async function updateEvent(id: string, data: UpdateEventInput): Promise<void> {
  // Handle image cleanup
  if (data.keepImageIds !== undefined) {
    const allImages = await prisma.image.findMany({
      where: { eventId: id },
      select: { id: true, publicId: true },
    })
    const toRemove = allImages.filter((img) => !data.keepImageIds!.includes(img.id))
    if (toRemove.length > 0) {
      await deleteImages(toRemove.map((img) => img.publicId))
      await prisma.image.deleteMany({ where: { id: { in: toRemove.map((img) => img.id) } } })
    }
  }

  // Add new images
  if (data.newImages?.length) {
    await prisma.image.createMany({
      data: data.newImages.map((img) => ({
        url: img.url,
        alt: img.alt ?? null,
        publicId: img.publicId,
        eventId: id,
      })),
    })
  }

  // Update event fields
  const { keepImageIds: _k, newImages: _n, dates, ...fields } = data
  await prisma.event.update({
    where: { id },
    data: {
      ...fields,
      ...(dates?.length
        ? {
            dates: {
              deleteMany: {},
              create: dates.map((date) => ({ date })),
            },
          }
        : {}),
    },
  })

  revalidateTag("events", {})
}

export async function softDeleteEvent(id: string): Promise<void> {
  // Also delete images from Cloudinary so storage stays clean
  const images = await prisma.image.findMany({
    where: { eventId: id },
    select: { publicId: true },
  })
  if (images.length > 0) {
    await deleteImages(images.map((img) => img.publicId))
  }

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
