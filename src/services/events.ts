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
  };
};

// Get all events
export const getAllEvents = async (): Promise<Event[]> => {
  const events = await prisma.event.findMany({
    include: {
      dates: true,
      artist: true,
      images: true,
    },
    where: {
      isActive: true,
    },
  });

  return events.map(mapPrismaEventToEvent);
};

// Get event by ID
export const getEventById = async (id: string): Promise<Event | null> => {
  const event = await prisma.event.findUnique({
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

  if (!event) return null;
  return mapPrismaEventToEvent(event);
};

// Get event by slug
export const getEventBySlug = async (slug: string): Promise<Event | null> => {
  const event = await prisma.event.findUnique({
    where: {
      slug,
      isActive: true,
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
export const getEventsByGenre = async (genre: string): Promise<Event[]> => {
  const events = await prisma.event.findMany({
    where: {
      genre,
      isActive: true,
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
export async function getEventsByArtistName(artistName: string): Promise<Event[]> {
  const events = await prisma.event.findMany({
    where: {
      artist: {
        name: {
          contains: artistName,
          mode: "insensitive",
        },
      },
      isActive: true,
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
export const getEventsByArtistId = async (artistId: string): Promise<Event[]> => {
  const events = await prisma.event.findMany({
    where: {
      artistId,
      isActive: true,
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
export const getEventsByArtistSlug = async (artistSlug: string): Promise<Event[]> => {
  const artist = await prisma.artist.findUnique({
    where: { slug: artistSlug },
    select: { id: true },
  });

  if (!artist) return [];

  return getEventsByArtistId(artist.id);
};

// Get events by date
export const getEventsByDate = async (date: Date): Promise<Event[]> => {
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
    },
    include: {
      dates: true,
      artist: true,
      images: true,
    },
  });

  return events.map(mapPrismaEventToEvent);
};
