"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

// Form validation schema
const updateArtistSchema = z.object({
  name: z.string().min(2),
  bio: z.string().min(10),
  origin: z.string().min(2),
  genres: z.array(z.string()).min(1),
  socialMedia: z.object({
    instagram: z.string().optional(),
    spotify: z.string().optional(),
    youtube: z.string().optional(),
    website: z.string().optional(),
    tiktok: z.string().optional(),
  }),
  images: z
    .array(
      z.object({
        url: z.string(),
        alt: z.string().optional(),
        public_id: z.string().optional(),
      })
    )
    .optional(),
});

type UpdateArtistInput = z.infer<typeof updateArtistSchema>;

// Helper function to check if a user owns an artist
async function userOwnsArtist(userId: string, artistId: string): Promise<boolean> {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { userId: true },
  });

  return !!artist && artist.userId === userId;
}

// Helper function to update an artist
async function updateArtistInternal(artistId: string, data: UpdateArtistInput) {
  // Generate slug if name has changed
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    include: { images: true },
  });

  if (!artist) {
    throw new Error("Artist not found");
  }

  const slug = data.name !== artist.name ? slugify(data.name) : artist.slug;

  // Update artist with transaction to handle images
  const updatedArtist = await prisma.$transaction(async (tx) => {
    // Update basic artist data
    await tx.artist.update({
      where: { id: artistId },
      data: {
        name: data.name,
        bio: data.bio,
        origin: data.origin,
        genres: data.genres,
        slug,
        socialMedia: data.socialMedia || {},
      },
    });

    // Update images if provided
    if (data.images && data.images.length > 0) {
      // Delete existing images
      await tx.image.deleteMany({
        where: { artistId },
      });

      // Create new images
      await tx.image.createMany({
        data: data.images.map((img) => ({
          url: img.url,
          alt: img.alt || data.name,
          public_id: img.public_id,
          artistId,
        })),
      });
    }

    // Get the updated artist with new images
    return tx.artist.findUnique({
      where: { id: artistId },
      include: {
        images: true,
        events: true,
      },
    });
  });

  if (!updatedArtist) {
    throw new Error("Failed to update artist");
  }

  // Map to our Artist type
  return {
    id: updatedArtist.id,
    name: updatedArtist.name,
    slug: updatedArtist.slug,
    genres: updatedArtist.genres,
    bio: updatedArtist.bio,
    origin: updatedArtist.origin,
    images: updatedArtist.images.map((img) => ({
      url: img.url,
      alt: img.alt,
    })),
    socialMedia: updatedArtist.socialMedia as { [key: string]: string } | undefined,
    upcomingEvents: updatedArtist.events?.map((event) => event.id) || [],
  };
}

export async function updateArtist(artistId: string, data: UpdateArtistInput) {
  try {
    // Validate data
    const validatedData = updateArtistSchema.parse(data);

    // Get current user
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return { success: false, error: "No autenticado" };
    }

    // Check if user owns this artist
    const hasAccess = await userOwnsArtist(userId, artistId);

    if (!hasAccess) {
      return { success: false, error: "No tienes permisos para editar este artista" };
    }

    // Update artist
    const updatedArtist = await updateArtistInternal(artistId, validatedData);

    return { success: true, artist: updatedArtist };
  } catch (error) {
    console.error("Error updating artist:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Datos inválidos",
        validationErrors: error.errors,
      };
    }

    return {
      success: false,
      error: "Error al actualizar el artista",
    };
  }
}
