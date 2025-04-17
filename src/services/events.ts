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
  dates: {
    date: string;
    dateObj: Date;
  }[];
  artist: string;
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

// Map Prisma Event model to our application Event model
function mapPrismaEventToEvent(
  event: PrismaEvent & {
    images: PrismaImage[];
    dates: PrismaEventDate[];
    artist: PrismaArtist;
  }
): Event {
  return {
    id: event.id,
    title: event.title,
    description: event.description || undefined,
    artist: event.artist.name,
    genre: event.genre,
    location: event.location,
    time: event.time,
    price: event.price || undefined,
    images: event.images.map((image) => ({
      url: image.url,
      alt: image.alt,
    })),
    dates: event.dates.map((dateItem) => ({
      date: dateItem.date.toLocaleDateString(),
      dateObj: dateItem.date,
    })),
  };
}

// Get all events
export async function getAllEvents(): Promise<Event[]> {
  const events = await prisma.event.findMany({
    include: {
      images: true,
      dates: true,
      artist: true,
    },
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return events.map(mapPrismaEventToEvent);
}

// Get event by ID
export async function getEventById(id: string): Promise<Event | null> {
  const event = await prisma.event.findUnique({
    where: {
      id,
      isActive: true,
    },
    include: {
      images: true,
      dates: true,
      artist: true,
    },
  });

  if (!event) return null;

  return mapPrismaEventToEvent(event);
}

// Get events by genre
export async function getEventsByGenre(genre: string): Promise<Event[]> {
  const events = await prisma.event.findMany({
    where: {
      genre,
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
export async function getEventsByArtistId(artistId: string): Promise<Event[]> {
  const events = await prisma.event.findMany({
    where: {
      artistId,
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

// Get events by date
export async function getEventsByDate(date: Date): Promise<Event[]> {
  // Create range for the whole day
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
      images: true,
      dates: true,
      artist: true,
    },
  });

  return events.map(mapPrismaEventToEvent);
}
