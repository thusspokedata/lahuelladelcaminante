import "server-only"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { startOfTodayBerlin } from "@/lib/date"
import { rehydrateDates } from "@/lib/date"
import type { EventSummary } from "./events"

export interface CreatorSocialMedia {
  instagram?: string
  website?: string
  other?: { label: string; url: string }
}

export interface CreatorDetail {
  id: string
  name: string
  slug: string
  bio: string | null
  city: string | null
  image: string | null
  socialMedia: CreatorSocialMedia | null
}

const _getCreatorBySlug = unstable_cache(
  async (slug: string): Promise<CreatorDetail | null> => {
    const profile = await prisma.userProfile.findUnique({
      where: { slug },
      include: { user: true },
    })
    if (!profile || profile.status === "BLOCKED") return null
    const u = profile.user
    if (u.role !== "creator" && u.role !== "admin") return null
    return {
      id: u.id,
      name: u.name,
      slug: profile.slug!,
      bio: profile.bio,
      city: profile.city,
      image: u.image,
      socialMedia: (profile.socialMedia as CreatorSocialMedia | null) ?? null,
    }
  },
  ["creator-by-slug"],
  { revalidate: 300, tags: ["creators"] }
)

export async function getCreatorBySlug(slug: string): Promise<CreatorDetail | null> {
  return _getCreatorBySlug(slug)
}

// Per-creator event gallery (upcoming + past). Reuses startOfTodayBerlin()
// and sortByNextDate logic. mapEvent is local because mapToSummary in
// events.ts is file-private (no export).

const eventInclude = {
  dates: { orderBy: { date: "asc" as const } },
  artist: { select: { name: true } },
  images: { select: { url: true, publicId: true, alt: true } },
}

function futureEventInclude(from: Date) {
  return {
    dates: { where: { date: { gte: from } }, orderBy: { date: "asc" as const }, take: 1 },
    artist: { select: { name: true } },
    images: { select: { url: true, publicId: true, alt: true } },
  }
}

function mapEvent(e: {
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
  const cover = e.images?.[0] ?? null
  return {
    id: e.id,
    title: e.title,
    slug: e.slug,
    location: e.location,
    genre: e.genre,
    time: e.time,
    price: e.price,
    dates: e.dates.map((d: { date: Date }) => d.date),
    artistName: e.artist?.name ?? null,
    coverImage: cover?.url ?? null,
    coverImagePublicId: cover?.publicId ?? null,
    coverImageAlt: cover?.alt ?? null,
  }
}

function sortByNextDate(events: EventSummary[]): EventSummary[] {
  return [...events].sort((a, b) => {
    const da = a.dates[0]?.getTime() ?? Infinity
    const db = b.dates[0]?.getTime() ?? Infinity
    return da - db
  })
}

const _getUpcomingEventsByCreator = unstable_cache(
  async (userId: string): Promise<EventSummary[]> => {
    const today = startOfTodayBerlin()
    const events = await prisma.event.findMany({
      where: {
        createdById: userId,
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: today } } },
      },
      include: futureEventInclude(today),
    })
    return sortByNextDate(events.map(mapEvent))
  },
  ["upcoming-events-by-creator"],
  { revalidate: 300, tags: ["events", "creators"] }
)

export async function getUpcomingEventsByCreator(userId: string): Promise<EventSummary[]> {
  const events = await _getUpcomingEventsByCreator(userId)
  return events.map((e) => ({ ...e, dates: rehydrateDates(e.dates) }))
}

const _getPastEventsByCreator = unstable_cache(
  async (userId: string): Promise<EventSummary[]> => {
    const today = startOfTodayBerlin()
    const events = await prisma.event.findMany({
      where: {
        createdById: userId,
        isDeleted: false,
        dates: { every: { date: { lt: today } } },
      },
      include: eventInclude,
      orderBy: { createdAt: "desc" },
    })
    return events.map(mapEvent)
  },
  ["past-events-by-creator"],
  { revalidate: 600, tags: ["events", "creators"] }
)

export async function getPastEventsByCreator(userId: string): Promise<EventSummary[]> {
  const events = await _getPastEventsByCreator(userId)
  return events.map((e) => ({ ...e, dates: rehydrateDates(e.dates) }))
}
