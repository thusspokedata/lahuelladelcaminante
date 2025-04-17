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
