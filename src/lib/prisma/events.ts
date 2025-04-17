import { prisma } from "@/lib/db";

/**
 * Get all events from the database
 * Includes related EventDates, Artist and Images
 */
export async function getAllEvents() {
  return await prisma.event.findMany({
    where: {
      isActive: true,
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });
}

/**
 * Get an event by its ID
 * Includes related EventDates, Artist and Images
 */
export async function getEventById(id: string) {
  return await prisma.event.findUnique({
    where: {
      id,
      isActive: true,
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });
}

/**
 * Get events by date
 * Returns events that have a date on the specified day
 */
export async function getEventsByDate(date: Date) {
  // Create date range for the day (from start to end of the day)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await prisma.event.findMany({
    where: {
      isActive: true,
      dates: {
        some: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      },
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });
}

/**
 * Get events by genre
 */
export async function getEventsByGenre(genre: string) {
  return await prisma.event.findMany({
    where: {
      isActive: true,
      genre,
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });
}

/**
 * Get events by artist ID
 */
export async function getEventsByArtist(artistId: string) {
  return await prisma.event.findMany({
    where: {
      isActive: true,
      artistId,
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });
}
