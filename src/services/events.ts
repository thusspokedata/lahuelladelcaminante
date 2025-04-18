import { prisma } from "@/lib/db";
import {
  Event as PrismaEvent,
  Image as PrismaImage,
  EventDate as PrismaEventDate,
  Artist as PrismaArtist,
} from "@/generated/prisma";
import { slugify } from "@/lib/utils";

export interface Event {
  id: string;
  title: string;
  slug: string;
  dates: {
    id: string;
    date: Date;
  }[];
  artist?: {
    id: string;
    name: string;
    slug: string;
  };
  genre: string;
  location: string;
  time: string;
  price?: number;
  organizer: string;
  description?: string;
  images: {
    url: string;
    alt: string;
    public_id?: string;
  }[];
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdById?: string | null;
}

// Type for creating a new event
export interface CreateEventInput {
  title: string;
  artistId?: string;
  dates: Date[];
  location: string;
  time: string;
  price?: number;
  description?: string;
  genre: string;
  images?: {
    url: string;
    alt: string;
    public_id?: string;
  }[];
  organizerName: string;
  createdById?: string;
}

type EventWithRelations = PrismaEvent & {
  dates: PrismaEventDate[];
  artist?: PrismaArtist | null;
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
    ...(event.artist
      ? {
          artist: {
            id: event.artist.id,
            name: event.artist.name,
            slug: event.artist.slug,
          },
        }
      : {}),
    genre: event.genre,
    location: event.location,
    time: event.time,
    price: event.price || undefined,
    organizer: event.organizer,
    description: event.description || undefined,
    images: event.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      public_id: image.public_id || undefined,
    })),
    isDeleted: event.isDeleted,
    deletedAt: event.deletedAt,
    createdById: event.createdById,
  };
};

// Create a new event
export const createEvent = async (data: CreateEventInput): Promise<Event> => {
  const {
    title,
    artistId,
    dates,
    location,
    time,
    price,
    description,
    genre,
    images,
    organizerName,
    createdById,
  } = data;

  // Verify received image data
  console.log("Service received images:", images ? JSON.stringify(images, null, 2) : "No images");

  // Create a unique slug from the title
  const baseSlug = slugify(title);
  const slug = await generateUniqueSlug(baseSlug);

  // Create the event with transaction to ensure all related data is created
  const event = await prisma.$transaction(async (tx) => {
    // Prepare image data for creation
    const imageData =
      images && images.length > 0
        ? {
            images: {
              create: images.map((img) => {
                console.log("Creating image:", img);
                return {
                  url: img.url,
                  alt: img.alt || title,
                  public_id: img.public_id,
                };
              }),
            },
          }
        : {};

    console.log("Image data for creation:", JSON.stringify(imageData, null, 2));

    // Create the event
    const newEvent = await tx.event.create({
      data: {
        title,
        slug,
        location,
        time,
        price,
        description,
        genre,
        organizer: organizerName,
        createdById,
        // Only include artistId if provided
        ...(artistId ? { artistId } : {}),
        // Create date entries
        dates: {
          create: dates.map((date) => ({ date })),
        },
        // Create image entries if provided
        ...imageData,
      } as unknown as import("@/generated/prisma").Prisma.EventCreateInput,
      include: {
        dates: true,
        artist: true,
        images: true,
      },
    });

    console.log("Event created with images:", newEvent.images.length);
    return newEvent;
  });

  return mapPrismaEventToEvent(event);
};

// Helper function to generate a unique slug
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 0;

  // Check if slug exists
  while (true) {
    const existingEvent = await prisma.event.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existingEvent) break;

    // If slug exists, append counter and try again
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

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
