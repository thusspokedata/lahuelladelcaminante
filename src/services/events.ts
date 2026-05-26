import "server-only"

import { cache } from "react"
import { unstable_cache, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { rehydrateDate, rehydrateDates, startOfTodayBerlin } from "@/lib/date"
import { generateUniqueSlug } from "@/lib/slugify"
import { deleteImages } from "./cloudinary"

/**
 * Re-hidrata los `Date` de un `EventSummary` por si vienen como string
 * desde `unstable_cache`. Ver `src/lib/date.ts` para el porqué. Es un
 * no-op cuando se llama sobre un objeto cuyas dates ya son Date reales
 * (caso pre-cache dentro de un callback de `unstable_cache`). */
function rehydrateEvent(e: EventSummary): EventSummary {
  return { ...e, dates: rehydrateDates(e.dates) }
}

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
  publishedBy: {
    name: string
    slug: string | null
  }
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

export function mapToSummary(event: {
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

export const eventInclude = {
  dates: { orderBy: { date: "asc" as const } },
  artist: { select: { name: true } },
  images: { select: { url: true, publicId: true, alt: true } },
}

/**
 * Variante de `eventInclude` para queries de "lo que viene": solo trae
 * la próxima fecha futura (no las pasadas) y solo una. Así `event.dates[0]`
 * en el `mapToSummary` resulta en la próxima fecha real del evento, no
 * en una fecha pasada de un evento que tiene varias funciones.
 */
export function futureEventInclude(from: Date, until?: Date) {
  return {
    dates: {
      where: {
        date: { gte: from, ...(until ? { lte: until } : {}) },
      },
      orderBy: { date: "asc" as const },
      take: 1,
    },
    artist: { select: { name: true } },
    images: { select: { url: true, publicId: true, alt: true } },
  }
}

/**
 * Ordena un set de EventSummary por su próxima fecha (ascendente). Asume
 * que cada summary ya viene con `dates` filtradas a futuras (la primera es
 * la próxima). Los que no tienen dates van al final.
 */
export function sortByNextDate(events: EventSummary[]): EventSummary[] {
  return [...events].sort((a, b) => {
    const da = a.dates[0]?.getTime() ?? Infinity
    const db = b.dates[0]?.getTime() ?? Infinity
    return da - db
  })
}

/**
 * Decide cuál variante de copy mostrar en el hero de la home, en una sola
 * query liviana (sin includes pesados). Resuelve la cascada:
 *  - hay shows en los próximos 7 días        → `"thisWeek"`
 *  - hay shows en los próximos 30 días       → `"nextMonth"`
 *  - no hay shows próximos                   → `"whatComes"`
 */
export const getHeroVariant = unstable_cache(
  async (): Promise<"thisWeek" | "nextMonth" | "whatComes"> => {
    // Filtramos por día calendario en Berlín, no por instante (ver
    // `startOfTodayBerlin` y el comentario en `@/lib/date`). Los `in7`/
    // `in30` se calculan en ms desde ese inicio de día — tz-independiente.
    const today = startOfTodayBerlin()
    // `+(N+1)*24h - 1ms` = último instante del día calendario Berlín N
    // días después de hoy, INCLUSIVE. Sin el +1 perdíamos los eventos
    // del día N (almacenados como 00:00 UTC = anteriores al bound).
    const in7 = new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000 - 1)
    const in30 = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000 - 1)

    // Una sola query: trae la próxima fecha de evento activo no borrado
    // y decidimos contra los umbrales en memoria. `select: { date: true }`
    // mantiene el payload mínimo.
    const nextDate = await prisma.eventDate.findFirst({
      where: {
        date: { gte: today, lte: in30 },
        event: { isDeleted: false, isActive: true },
      },
      orderBy: { date: "asc" },
      select: { date: true },
    })

    if (!nextDate) return "whatComes"
    return nextDate.date <= in7 ? "thisWeek" : "nextMonth"
  },
  ["hero-variant"],
  { revalidate: 300, tags: ["events"] }
)

/**
 * Eventos activos cuya próxima fecha cae dentro de los próximos `days` días.
 * Usado por la home para llenar las listas (agenda compacta) con un set
 * acotado en lugar de toda la agenda futura. El include filtra dates a
 * futuras y los resultados se ordenan por la próxima fecha (no por
 * createdAt) — la card depende de `event.dates[0]` para mostrar "JUN 7".
 */
const _getUpcomingEventsWithin = unstable_cache(
  async (days: number, limit?: number): Promise<EventSummary[]> => {
    const today = startOfTodayBerlin()
    // `+(days+1)*24h - 1ms` = último instante del día calendario Berlín
    // `days` después de hoy, INCLUSIVE (los eventos se guardan como
    // 00:00 UTC, así que el bound debe extenderse al fin del día para
    // capturarlos). Ver mismo patrón en getHeroVariant.
    const until = new Date(today.getTime() + (days + 1) * 24 * 60 * 60 * 1000 - 1)
    const events = await prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: today, lte: until } } },
      },
      include: futureEventInclude(today, until),
    })
    const ordered = sortByNextDate(events.map(mapToSummary))
    return limit ? ordered.slice(0, limit) : ordered
  },
  ["upcoming-events-within"],
  { revalidate: 300, tags: ["events"] }
)

export async function getUpcomingEventsWithin(
  days: number,
  limit?: number
): Promise<EventSummary[]> {
  return (await _getUpcomingEventsWithin(days, limit)).map(rehydrateEvent)
}

/**
 * Próximos 3-N eventos para la sección "Imperdibles" de la home. Por ahora
 * usamos un proxy: los próximos por fecha. TODO: cuando exista un flag
 * `featured` en el modelo Event, filtrar por ese flag aquí. El include
 * filtra dates a futuras y los resultados se ordenan por la próxima fecha
 * (no por createdAt) para que la card muestre la fecha próxima real.
 */
const _getFeaturedEvents = unstable_cache(
  async (limit = 3): Promise<EventSummary[]> => {
    const today = startOfTodayBerlin()
    const events = await prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: today } } },
      },
      include: futureEventInclude(today),
    })
    return sortByNextDate(events.map(mapToSummary)).slice(0, limit)
  },
  ["featured-events"],
  { revalidate: 300, tags: ["events"] }
)

export async function getFeaturedEvents(limit = 3): Promise<EventSummary[]> {
  return (await _getFeaturedEvents(limit)).map(rehydrateEvent)
}

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
const _getUpcomingStats = unstable_cache(
  async (): Promise<UpcomingStats> => {
    const today = startOfTodayBerlin()
    const events = await prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: today } } },
      },
      select: {
        artistId: true,
        location: true,
        dates: { where: { date: { gte: today } }, select: { date: true } },
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
      // "shows" cuenta instancias/funciones, no eventos: una banda que
      // toca 3 noches consecutivas son 3 shows. Coincide con la jerga
      // del producto y con el rango de fechas mostrado abajo.
      shows: allDates.length,
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

export async function getUpcomingStats(): Promise<UpcomingStats> {
  const s = await _getUpcomingStats()
  return {
    ...s,
    dateRange: {
      from: rehydrateDate(s.dateRange.from),
      to: rehydrateDate(s.dateRange.to),
    },
  }
}

const _getUpcomingEvents = unstable_cache(
  async (filters?: { genre?: string; city?: string }): Promise<EventSummary[]> => {
    const today = startOfTodayBerlin()
    const events = await prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: today } } },
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

export async function getUpcomingEvents(
  filters?: { genre?: string; city?: string }
): Promise<EventSummary[]> {
  return (await _getUpcomingEvents(filters)).map(rehydrateEvent)
}

const _getPastEvents = unstable_cache(
  async (limit?: number): Promise<EventSummary[]> => {
    const events = await prisma.event.findMany({
      where: {
        isDeleted: false,
        dates: { every: { date: { lt: startOfTodayBerlin() } } },
      },
      include: eventInclude,
      orderBy: { createdAt: "desc" },
      ...(limit !== undefined ? { take: limit } : {}),
    })
    return events.map(mapToSummary)
  },
  ["past-events"],
  { revalidate: 600, tags: ["events"] }
)

/**
 * Eventos pasados — no eliminados (`isDeleted: false`) cuyas fechas ya
 * ocurrieron todas. Sin `limit` devuelve la lista completa
 * (`/events/past`); con `limit`, los N más recientes — lo usa la sección
 * de eventos pasados del home. Orden `createdAt` desc.
 *
 * NOTA: a diferencia de `getUpcomingEvents`, no filtra por `isActive`
 * (comportamiento preexistente de `/events/past`, ver review del PR).
 */
export async function getPastEvents(limit?: number): Promise<EventSummary[]> {
  return (await _getPastEvents(limit)).map(rehydrateEvent)
}

/**
 * Wrapeado con `cache()` de React para dedupe **dentro del mismo request**:
 * `generateMetadata` y el `page` default llaman a `getEventBySlug(slug)`
 * por separado en el render del detalle. Sin este wrapper, son dos queries
 * a Prisma con includes pesados. `cache()` hace que la segunda llamada
 * con el mismo arg reuse el resultado de la primera.
 *
 * No usamos `unstable_cache` porque la invalidación de events ya se hace
 * por tag desde `updateEvent`/`softDeleteEvent`, y la frecuencia de hits
 * al detalle no justifica el overhead de cache de Next; el dedupe
 * request-scoped es suficiente para evitar el bug obvio.
 */
export const getEventBySlug = cache(_getEventBySlugImpl)

async function _getEventBySlugImpl(slug: string): Promise<EventDetail | null> {
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
      createdBy: {
        select: {
          name: true,
          profile: { select: { slug: true } },
        },
      },
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
    publishedBy: {
      name: event.createdBy.name,
      slug: event.createdBy.profile?.slug ?? null,
    },
  }
}

export const getActiveGenres = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await prisma.event.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        genre: { not: null },
        dates: { some: { date: { gte: startOfTodayBerlin() } } },
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
        dates: { some: { date: { gte: startOfTodayBerlin() } } },
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

/**
 * Próximos eventos de un artista, ordenados por la próxima fecha (más
 * cercana primero). Usado por el detalle de artista para la sección
 * "Próximas fechas". Solo trae la próxima fecha futura del evento (no
 * todas las fechas pasadas), igual que `getUpcomingEventsWithin`.
 */
const _getUpcomingEventsByArtist = unstable_cache(
  async (artistId: string, limit?: number): Promise<EventSummary[]> => {
    const today = startOfTodayBerlin()
    const events = await prisma.event.findMany({
      where: {
        artistId,
        isDeleted: false,
        isActive: true,
        dates: { some: { date: { gte: today } } },
      },
      include: futureEventInclude(today),
    })
    const ordered = sortByNextDate(events.map(mapToSummary))
    return limit ? ordered.slice(0, limit) : ordered
  },
  ["upcoming-events-by-artist"],
  { revalidate: 300, tags: ["events"] }
)

export async function getUpcomingEventsByArtist(
  artistId: string,
  limit?: number
): Promise<EventSummary[]> {
  return (await _getUpcomingEventsByArtist(artistId, limit)).map(rehydrateEvent)
}

/**
 * Otros próximos eventos de un artista, excluyendo uno específico. Usado
 * por el detalle de evento para la sección "Otros shows de este artista".
 * Ordena por próxima fecha. Reusa la lógica de `_getUpcomingEventsByArtist`
 * porque el filtro adicional es solo `excludeEventId`.
 */
const _getOtherEventsByArtist = unstable_cache(
  async (
    artistId: string,
    excludeEventId: string,
    limit?: number
  ): Promise<EventSummary[]> => {
    const today = startOfTodayBerlin()
    const events = await prisma.event.findMany({
      where: {
        artistId,
        isDeleted: false,
        isActive: true,
        id: { not: excludeEventId },
        dates: { some: { date: { gte: today } } },
      },
      include: futureEventInclude(today),
    })
    const ordered = sortByNextDate(events.map(mapToSummary))
    return limit ? ordered.slice(0, limit) : ordered
  },
  ["other-events-by-artist"],
  { revalidate: 300, tags: ["events"] }
)

export async function getOtherEventsByArtist(
  artistId: string,
  excludeEventId: string,
  limit?: number
): Promise<EventSummary[]> {
  return (await _getOtherEventsByArtist(artistId, excludeEventId, limit)).map(
    rehydrateEvent
  )
}

export async function getEventsByUser(userId: string): Promise<EventSummary[]> {
  const events = await prisma.event.findMany({
    where: { createdById: userId, isDeleted: false },
    include: eventInclude,
    orderBy: { createdAt: "desc" },
  })
  return events.map(mapToSummary)
}

/**
 * Eventos del creator agrupados por estado para el listado del dashboard
 * con tabs (Próximos / Borradores / Pasados / Todos).
 *
 *  - `upcoming`: activos, con al menos una fecha futura. Ordenados por la
 *                próxima fecha (ascendente) igual que `getUpcomingEventsWithin`
 *                para que el `EventRow` muestre la próxima cronología real.
 *  - `drafts`:   `isActive: false` (despublicados) **o** evento activo sin
 *                ninguna fecha cargada. Sin fechas es un evento a medio
 *                completar — lo tratamos como borrador hasta que tenga
 *                fecha, así no aparece zombi en "Pasados".
 *  - `past`:     activos, todas las fechas ya pasaron.
 *  - `all`:      todos los no borrados, sin importar estado.
 *
 * Todos los buckets excluyen soft-deleted. Una sola query a Prisma — el
 * agrupado se hace en memoria. Para el volumen de eventos por creator
 * (decenas, no miles) es óptimo: evitamos 4 round-trips y mantenemos
 * consistencia entre tabs (no hay drift entre "se borró acá pero sigue
 * en otra tab").
 *
 * **No se cachea con `unstable_cache`** (a diferencia del resto del
 * archivo): scope per-user, mutación frecuente desde la propia UI
 * (crear/editar/borrar desde el mismo dashboard), y la cache key tendría
 * que incluir `userId` lo que invalida cualquier beneficio. Confiamos en
 * la dedupe request-scoped del page render.
 */
export interface EventsByUserGrouped {
  upcoming: EventSummary[]
  drafts: EventSummary[]
  past: EventSummary[]
  all: EventSummary[]
}

export async function getEventsByUserGrouped(
  userId: string
): Promise<EventsByUserGrouped> {
  const events = await prisma.event.findMany({
    where: { createdById: userId, isDeleted: false },
    include: eventInclude,
    orderBy: { createdAt: "desc" },
  })
  const today = startOfTodayBerlin()

  // Agrupamos sobre el array Prisma para tener acceso a `isActive` (no
  // expuesto en `EventSummary`). `event.dates` viene ordenado asc por
  // `eventInclude`. Para distinguir upcoming/past comparamos la **última**
  // fecha contra el inicio del día calendario Berlín: si la última ya
  // pasó (anterior a hoy), el evento entero es pasado; si hay al menos
  // una hoy/futura, es upcoming. Evita duplicación entre buckets.
  const upcoming: EventSummary[] = []
  const drafts: EventSummary[] = []
  const past: EventSummary[] = []
  const all: EventSummary[] = []
  for (const raw of events) {
    const summary = mapToSummary(raw)
    all.push(summary)
    // Borrador o evento sin fecha → drafts (ver docstring).
    if (!raw.isActive || summary.dates.length === 0) {
      drafts.push(summary)
      continue
    }
    const lastDate = summary.dates[summary.dates.length - 1]
    if (lastDate && lastDate >= today) {
      // En upcoming filtramos las fechas a solo las hoy/futuras, para
      // que el `EventRow` muestre la próxima cronológica real
      // (`dates[0]`) en su `DateTile`. Sin este filtro, un evento con
      // varias funciones (una pasada + una futura) mostraría la pasada
      // porque `dates` viene ordenado asc desde el include.
      upcoming.push({
        ...summary,
        dates: summary.dates.filter((d) => d >= today),
      })
    } else {
      past.push(summary)
    }
  }

  return {
    upcoming: sortByNextDate(upcoming),
    drafts,
    past,
    all,
  }
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

  revalidateTag("events", { expire: 0 })
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

  revalidateTag("events", { expire: 0 })
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
  revalidateTag("events", { expire: 0 })
}

export async function restoreEvent(id: string): Promise<void> {
  await prisma.event.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
  })
  revalidateTag("events", { expire: 0 })
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
  revalidateTag("events", { expire: 0 })
}
