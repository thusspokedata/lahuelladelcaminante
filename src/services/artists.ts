import { prisma } from "@/lib/db";
import { Artist as PrismaArtist, Image as PrismaImage } from "@/generated/prisma";

export interface Artist {
  id: string;
  name: string;
  genres: string[];
  bio: string;
  origin: string;
  images: {
    url: string;
    alt: string;
  }[];
  socialMedia?: {
    instagram?: string;
    spotify?: string;
    youtube?: string;
    website?: string;
    tiktok?: string;
  };
  upcomingEvents?: string[]; // References to event IDs
}

// Define type for social media to avoid using 'any'
type SocialMedia = {
  instagram?: string;
  spotify?: string;
  youtube?: string;
  website?: string;
  tiktok?: string;
};

// Map Prisma Artist model to our application Artist model
function mapPrismaArtistToArtist(
  artist: PrismaArtist & { images: PrismaImage[]; events?: { id: string }[] }
): Artist {
  return {
    id: artist.id,
    name: artist.name,
    genres: artist.genres,
    bio: artist.bio,
    origin: artist.origin,
    images: artist.images.map((image) => ({
      url: image.url,
      alt: image.alt,
    })),
    // Parse JSON field from database to object
    socialMedia: artist.socialMedia ? (artist.socialMedia as SocialMedia) : undefined,
    // Map event IDs if they are included
    upcomingEvents: artist.events ? artist.events.map((event) => event.id) : [],
  };
}

// Get all artists
export async function getAllArtists(): Promise<Artist[]> {
  const artists = await prisma.artist.findMany({
    include: {
      images: true,
    },
  });

  return artists.map(mapPrismaArtistToArtist);
}

// Get artist by ID
export async function getArtistById(id: string): Promise<Artist | null> {
  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      images: true,
      events: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!artist) return null;

  return mapPrismaArtistToArtist(artist);
}

// Get artists by genre
export async function getArtistsByGenre(genre: string): Promise<Artist[]> {
  const artists = await prisma.artist.findMany({
    where: {
      genres: {
        has: genre,
      },
    },
    include: {
      images: true,
    },
  });

  return artists.map(mapPrismaArtistToArtist);
}

// Search artists by name
export async function searchArtistsByName(name: string): Promise<Artist[]> {
  const artists = await prisma.artist.findMany({
    where: {
      name: {
        contains: name,
        mode: "insensitive", // Case-insensitive search
      },
    },
    include: {
      images: true,
    },
  });

  return artists.map(mapPrismaArtistToArtist);
}
