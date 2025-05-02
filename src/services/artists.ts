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
  console.log("Mapping artist:", artist.name);
  console.log("Profile image ID:", artist.profileImageId);
  console.log("Images:", artist.images);

  // Mapear las imágenes y asegurarse de que public_id está definido
  const mappedImages = artist.images.map((img) => ({
    url: img.url,
    alt: img.alt,
    public_id: img.public_id || undefined,
  }));

  console.log("Mapped images:", mappedImages);

  // Si hay un profileImageId y no hay imagen con ese public_id,
  // podemos intentar buscar coincidencias parciales
  if (
    artist.profileImageId &&
    mappedImages.length > 0 &&
    !mappedImages.some((img) => img.public_id === artist.profileImageId)
  ) {
    console.log("Profile image not found by exact match, trying partial match");
    // Tratar de encontrar una imagen que contenga parte del profileImageId
    const profileImageByPartial = mappedImages.find(
      (img) =>
        img.public_id &&
        artist.profileImageId &&
        (img.public_id.includes(artist.profileImageId) ||
          artist.profileImageId.includes(img.public_id))
    );

    if (profileImageByPartial) {
      console.log("Found profile image by partial match:", profileImageByPartial);
      // Si encontramos un match parcial, usar ese public_id exacto
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
    images: mappedImages,
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
