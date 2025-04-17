import { prisma } from "@/lib/db";
import {
  Event as PrismaEvent,
  Image as PrismaImage,
  EventDate as PrismaEventDate,
  Artist as PrismaArtist,
} from "@/generated/prisma";

export interface Event {
  id: string;
  title: string;
  slug: string;
  dates: {
    id: string;
    date: Date;
  }[];
  artist: {
    id: string;
    name: string;
    slug: string;
  };
  genre: string;
  location: string;
  time: string;
  price?: number;
  description?: string;
  images: {
    url: string;
    alt: string;
  }[];
  isDeleted?: boolean;
  deletedAt?: Date | null;
}

type EventWithRelations = PrismaEvent & {
  dates: PrismaEventDate[];
  artist: PrismaArtist;
  images: PrismaImage[];
};

// Map Prisma Event model to our application Event model
const mapPrismaEventToEvent = (event: EventWithRelations): Event => {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    dates: event.dates.map((date) => ({
      id: date.id,
      date: date.date,
    })),
    artist: {
      id: event.artist.id,
      name: event.artist.name,
      slug: event.artist.slug,
    },
    genre: event.genre,
    location: event.location,
    time: event.time,
    price: event.price || undefined,
    description: event.description || undefined,
    images: event.images.map((image) => ({
      url: image.url,
      alt: image.alt,
    })),
    isDeleted: event.isDeleted,
    deletedAt: event.deletedAt,
  };
};

// Get all events
export const getAllEvents = async ({ includeDeleted = false } = {}): Promise<Event[]> => {
  const events = await prisma.event.findMany({
    include: {
      dates: true,
      artist: true,
      images: true,
    },
    where: {
      isActive: true,
      isDeleted: includeDeleted ? undefined : false,
    },
  });

  return events.map(mapPrismaEventToEvent);
};

// Get event by ID
export const getEventById = async (
  id: string,
  { includeDeleted = false } = {}
): Promise<Event | null> => {
  const event = await prisma.event.findUnique({
    where: {
      id,
      isActive: true,
      ...(includeDeleted ? {} : { isDeleted: false }),
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });

  if (!event) return null;
  return mapPrismaEventToEvent(event);
};

// Get event by slug
export const getEventBySlug = async (
  slug: string,
  { includeDeleted = false } = {}
): Promise<Event | null> => {
  const event = await prisma.event.findUnique({
    where: {
      slug,
      isActive: true,
      ...(includeDeleted ? {} : { isDeleted: false }),
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });

  if (!event) return null;
  return mapPrismaEventToEvent(event);
};

// Get events by genre
export const getEventsByGenre = async (
  genre: string,
  { includeDeleted = false } = {}
): Promise<Event[]> => {
  const events = await prisma.event.findMany({
    where: {
      genre,
      isActive: true,
      isDeleted: includeDeleted ? undefined : false,
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });

  return events.map(mapPrismaEventToEvent);
};

// Search events by artist name
export async function getEventsByArtistName(
  artistName: string,
  { includeDeleted = false } = {}
): Promise<Event[]> {
  const events = await prisma.event.findMany({
    where: {
      artist: {
        name: {
          contains: artistName,
          mode: "insensitive",
        },
      },
      isActive: true,
      isDeleted: includeDeleted ? undefined : false,
    },
    include: {
      images: true,
      dates: true,
      artist: true,
    },
  });

  return events.map(mapPrismaEventToEvent);
}

// Get events by artist ID
export const getEventsByArtistId = async (
  artistId: string,
  { includeDeleted = false } = {}
): Promise<Event[]> => {
  const events = await prisma.event.findMany({
    where: {
      artistId,
      isActive: true,
      isDeleted: includeDeleted ? undefined : false,
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });

  return events.map(mapPrismaEventToEvent);
};

// Get events by artist slug
export const getEventsByArtistSlug = async (
  artistSlug: string,
  { includeDeleted = false } = {}
): Promise<Event[]> => {
  const artist = await prisma.artist.findUnique({
    where: { slug: artistSlug },
    select: { id: true },
  });

  if (!artist) return [];

  return getEventsByArtistId(artist.id, { includeDeleted });
};

// Get events by date
export const getEventsByDate = async (
  date: Date,
  { includeDeleted = false } = {}
): Promise<Event[]> => {
  // Get the date without time component
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const events = await prisma.event.findMany({
    where: {
      dates: {
        some: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      isActive: true,
      isDeleted: includeDeleted ? undefined : false,
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });

  return events.map(mapPrismaEventToEvent);
};

// Mark an event as deleted (soft delete)
export const deleteEvent = async (id: string): Promise<Event | null> => {
  const event = await prisma.event.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });

  if (!event) return null;
  return mapPrismaEventToEvent(event);
};

// Restore a deleted event
export const restoreEvent = async (id: string): Promise<Event | null> => {
  const event = await prisma.event.update({
    where: { id },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });

  if (!event) return null;
  return mapPrismaEventToEvent(event);
};

// Get all deleted events
export const getDeletedEvents = async (): Promise<Event[]> => {
  const events = await prisma.event.findMany({
    where: {
      isDeleted: true,
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });

  return events.map(mapPrismaEventToEvent);
};

// Permanently delete an event (hard delete - for admin use only)
export const permanentlyDeleteEvent = async (id: string): Promise<void> => {
  await prisma.event.delete({
    where: { id },
  });
};
