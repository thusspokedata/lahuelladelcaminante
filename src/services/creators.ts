import "server-only"

import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { rehydrateDates, startOfTodayBerlin } from "@/lib/date"
import {
  eventInclude,
  futureEventInclude,
  mapToSummary,
  sortByNextDate,
  type EventSummary,
} from "./events"

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
      // El row se encontró por findUnique({ where: { slug } }) con `slug`
      // recibido como argumento; por construcción `profile.slug` es ese
      // mismo valor. Usamos `?? slug` en lugar de `!` para evitar la
      // non-null assertion y dejar el invariante visible.
      slug: profile.slug ?? slug,
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
    return sortByNextDate(events.map(mapToSummary))
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
        // NOTA: a diferencia de `_getUpcomingEventsByCreator`, no filtra
        // por `isActive` — mismo comportamiento que `_getPastEvents` en
        // events.ts. La sección de "pasados" del perfil público incluye
        // historia editorial: eventos que fueron publicados, ocurrieron, y
        // eventualmente se despublicaron siguen siendo parte del track
        // record del creator. Si se decide ocultar despublicados pasados,
        // agregar `isActive: true` acá y replicar en events.ts.
        dates: { every: { date: { lt: today } } },
      },
      include: eventInclude,
      orderBy: { createdAt: "desc" },
    })
    return events.map(mapToSummary)
  },
  ["past-events-by-creator"],
  { revalidate: 600, tags: ["events", "creators"] }
)

export async function getPastEventsByCreator(userId: string): Promise<EventSummary[]> {
  const events = await _getPastEventsByCreator(userId)
  return events.map((e) => ({ ...e, dates: rehydrateDates(e.dates) }))
}
