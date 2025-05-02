import { prisma } from "@/lib/db";
import {
  Artist as PrismaArtist,
  Image as PrismaImage,
  Event as PrismaEvent,
} from "@/generated/prisma";
import { auth } from "@clerk/nextjs/server";

export interface Artist {
  id: string;
  name: string;
  slug: string;
  genres: string[];
  bio: string;
  origin: string;
  images: { url: string; alt: string; public_id?: string }[];
  profileImageId?: string | null;
  socialMedia?: { [key: string]: string };
  upcomingEvents?: string[]; // Array of event IDs
}

type ArtistWithRelations = PrismaArtist & {
  images: PrismaImage[];
  events?: PrismaEvent[];
};

const mapPrismaArtistToArtist = (artist: ArtistWithRelations): Artist => {
  // Map artist data with image information
  const mappedArtist = {
    ...artist,
    images: artist.images.map((img) => ({
      url: img.url,
      alt: img.alt,
      public_id: img.public_id || undefined,
    })),
  };

  // If there's a profileImageId but no exact match in images,
  // try to find partial matches
  if (
    artist.profileImageId &&
    mappedArtist.images.length > 0 &&
    !mappedArtist.images.some((img) => img.public_id === artist.profileImageId)
  ) {
    // Try to find an image that contains part of the profileImageId
    const profileImageByPartial = mappedArtist.images.find(
      (img) =>
        img.public_id &&
        artist.profileImageId &&
        (img.public_id.includes(artist.profileImageId) ||
          artist.profileImageId.includes(img.public_id))
    );

    if (profileImageByPartial) {
      // If we find a partial match, use that exact public_id
      artist.profileImageId = profileImageByPartial.public_id || null;
    }
  }

  return {
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    genres: artist.genres,
    bio: artist.bio,
    origin: artist.origin,
    images: mappedArtist.images,
    profileImageId: artist.profileImageId,
    socialMedia: artist.socialMedia as { [key: string]: string } | undefined,
    upcomingEvents: artist.events?.map((event) => event.id) || [],
  };
};

export const getAllArtists = async (): Promise<Artist[]> => {
  const artists = await prisma.artist.findMany({
    include: {
      images: true,
      events: true,
    },
  });

  return artists.map(mapPrismaArtistToArtist);
};

export const getArtistById = async (id: string): Promise<Artist | null> => {
  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      images: true,
      events: true,
    },
  });

  if (!artist) return null;
  return mapPrismaArtistToArtist(artist);
};

export const getArtistBySlug = async (slug: string): Promise<Artist | null> => {
  const artist = await prisma.artist.findUnique({
    where: { slug },
    include: {
      images: true,
      events: true,
    },
  });

  if (!artist) return null;
  return mapPrismaArtistToArtist(artist);
};

export const getArtistsByGenre = async (genre: string): Promise<Artist[]> => {
  const artists = await prisma.artist.findMany({
    where: {
      genres: {
        has: genre,
      },
    },
    include: {
      images: true,
      events: true,
    },
  });

  return artists.map(mapPrismaArtistToArtist);
};

export const searchArtistsByName = async (name: string): Promise<Artist[]> => {
  const artists = await prisma.artist.findMany({
    where: {
      name: {
        contains: name,
        mode: "insensitive",
      },
    },
    include: {
      images: true,
      events: true,
    },
  });

  return artists.map(mapPrismaArtistToArtist);
};

/**
 * Get artists associated with a user
 */
export async function getArtistsByUser(userId?: string): Promise<Artist[]> {
  try {
    // If no userId provided, try to get from current user
    if (!userId) {
      const authResult = await auth();
      if (!authResult.userId) {
        return [];
      }
      userId = authResult.userId;
    }
  } catch (error) {
    console.error("Error getting artists by user:", error);
    return [];
  }

  const artists = await prisma.artist.findMany({
    where: {
      userId: userId,
    },
    include: {
      images: true,
      events: true,
    },
  });

  return artists.map(mapPrismaArtistToArtist);
}
