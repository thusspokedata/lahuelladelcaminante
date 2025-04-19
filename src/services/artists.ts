import { prisma } from "@/lib/db";
import {
  Artist as PrismaArtist,
  Image as PrismaImage,
  Event as PrismaEvent,
} from "@/generated/prisma";

export interface Artist {
  id: string;
  name: string;
  slug: string;
  genres: string[];
  bio: string;
  origin: string;
  images: { url: string; alt: string }[];
  socialMedia?: { [key: string]: string };
  upcomingEvents?: string[]; // Array of event IDs
}

type ArtistWithRelations = PrismaArtist & {
  images: PrismaImage[];
  events?: PrismaEvent[];
};

const mapPrismaArtistToArtist = (artist: ArtistWithRelations): Artist => {
  return {
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    genres: artist.genres,
    bio: artist.bio,
    origin: artist.origin,
    images: artist.images.map((img) => ({
      url: img.url,
      alt: img.alt,
    })),
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

// Función para generar un slug a partir del nombre
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, "-");
}

/**
 * Obtiene los artistas asociados al usuario actual
 */
export async function getUserArtists(userId: string) {
  try {
    if (!userId) {
      throw new Error("User ID es requerido");
    }

    const artists = await prisma.artist.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return artists;
  } catch (error) {
    console.error("Error al obtener los artistas:", error);
    throw new Error("No se pudieron obtener los artistas");
  }
}

/**
 * Crea un nuevo artista asociado al usuario actual
 */
export async function createArtistUser(name: string, userId: string) {
  try {
    if (!userId) {
      throw new Error("User ID es requerido");
    }

    // Verificar si ya existe un artista con ese nombre para este usuario
    const existingArtist = await prisma.artist.findFirst({
      where: {
        name: name,
        userId: userId,
      },
    });

    if (existingArtist) {
      throw new Error("Ya tienes un artista con ese nombre");
    }

    // Generar slug desde el nombre del artista
    const slug = generateSlug(name);

    const artist = await prisma.artist.create({
      data: {
        name,
        userId,
        slug,
        bio: "", // Campo requerido
        origin: "", // Campo requerido
        genres: [], // Campo requerido
      },
      select: {
        id: true,
        name: true,
      },
    });

    return artist;
  } catch (error) {
    console.error("Error al crear el artista:", error);
    throw error;
  }
}
