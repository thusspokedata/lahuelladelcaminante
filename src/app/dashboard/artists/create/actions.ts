"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { z } from "zod";

// Form validation schema
const createArtistSchema = z.object({
  name: z.string().min(2),
  bio: z.string().min(10),
  origin: z.string().min(2),
  genres: z.array(z.string()).min(1),
  userId: z.string(),
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
        isProfile: z.boolean().optional(),
      })
    )
    .optional(),
  profileImageId: z.string().optional().nullable(),
});

type CreateArtistInput = z.infer<typeof createArtistSchema>;

export async function createArtist(data: CreateArtistInput) {
  try {
    // Validate data
    const validatedData = createArtistSchema.parse(data);

    // Get current user
    const authResult = await auth();

    if (!authResult.userId) {
      return { success: false, error: "No autenticado" };
    }

    // Check if the user ID in the data matches the current user
    if (authResult.userId !== validatedData.userId) {
      return { success: false, error: "ID de usuario no válido" };
    }

    // Generate slug from name
    let slug = slugify(validatedData.name);

    // Check if slug already exists
    const existingArtistWithSlug = await prisma.artist.findUnique({
      where: { slug },
    });

    // If slug exists, append a random suffix
    if (existingArtistWithSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Create artist with images in a transaction
    const newArtist = await prisma.$transaction(async (tx) => {
      // Create the basic artist
      const artist = await tx.artist.create({
        data: {
          name: validatedData.name,
          bio: validatedData.bio,
          origin: validatedData.origin,
          genres: validatedData.genres,
          slug,
          userId: validatedData.userId,
          socialMedia: validatedData.socialMedia || {},
          profileImageId: validatedData.profileImageId || null,
        },
      });

      // Add images if provided
      if (validatedData.images && validatedData.images.length > 0) {
        await tx.image.createMany({
          data: validatedData.images.map((img) => ({
            url: img.url,
            alt: img.alt || validatedData.name,
            public_id: img.public_id,
            artistId: artist.id,
          })),
        });
      }

      return artist;
    });

    return {
      success: true,
      artistId: newArtist.id,
    };
  } catch (error) {
    console.error("Error creating artist:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Datos inválidos",
        validationErrors: error.errors,
      };
    }

    return {
      success: false,
      error: "Error al crear el artista",
    };
  }
}
