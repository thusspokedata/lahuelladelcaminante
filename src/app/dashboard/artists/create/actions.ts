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

    // Create artist
    const newArtist = await prisma.artist.create({
      data: {
        name: validatedData.name,
        bio: validatedData.bio,
        origin: validatedData.origin,
        genres: validatedData.genres,
        slug,
        userId: validatedData.userId,
        socialMedia: {}, // Empty object for now
      },
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
