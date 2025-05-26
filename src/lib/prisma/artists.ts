import { prisma } from "@/lib/db";
import { getDateWithoutTime } from "@/lib/utils";

/**
 * Get all artists from the database
 * Includes related events and images
 */
export async function getAllArtists() {
  return await prisma.artist.findMany({
    include: {
      events: {
        where: {
          isActive: true,
        },
        include: {
          dates: true,
          images: true,
        },
      },
      images: true,
    },
  });
}

/**
 * Get an artist by ID
 * Includes related events and images
 */
export async function getArtistById(id: string) {
  return await prisma.artist.findUnique({
    where: {
      id,
    },
    include: {
      events: {
        where: {
          isActive: true,
        },
        include: {
          dates: true,
          images: true,
        },
      },
      images: true,
    },
  });
}

/**
 * Get artists by genre
 * Includes related events and images
 */
export async function getArtistsByGenre(genre: string) {
  return await prisma.artist.findMany({
    where: {
      genres: {
        has: genre,
      },
    },
    include: {
      events: {
        where: {
          isActive: true,
        },
        include: {
          dates: true,
          images: true,
        },
      },
      images: true,
    },
  });
}

/**
 * Search artists by name
 * Performs a case-insensitive search on the name field
 */
export async function searchArtistsByName(name: string) {
  return await prisma.artist.findMany({
    where: {
      name: {
        contains: name,
        mode: "insensitive",
      },
    },
    include: {
      events: {
        where: {
          isActive: true,
        },
        include: {
          dates: true,
          images: true,
        },
      },
      images: true,
    },
  });
}

/**
 * Get artists with upcoming events
 * Includes only events that have dates in the future
 */
export async function getArtistsWithUpcomingEvents() {
  const today = getDateWithoutTime();

  return await prisma.artist.findMany({
    where: {
      events: {
        some: {
          isActive: true,
          dates: {
            some: {
              date: {
                gte: today,
              },
            },
          },
        },
      },
    },
    include: {
      events: {
        where: {
          isActive: true,
          dates: {
            some: {
              date: {
                gte: today,
              },
            },
          },
        },
        include: {
          dates: true,
          images: true,
        },
      },
      images: true,
    },
  });
}
