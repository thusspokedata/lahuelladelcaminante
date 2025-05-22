"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { z } from "zod";

// Form validation schema
const artistSchema = z.object({
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

type ArtistInput = z.infer<typeof artistSchema>;

export async function createArtist(data: ArtistInput) {
  try {
    // Validate data
    const validatedData = artistSchema.parse(data);

    // Get current user
    const authResult = await auth();

    if (!authResult.userId) {
      return { success: false, error: "No autenticado" };
    }

    // Check if the user ID in the data matches the current user
    if (authResult.userId !== validatedData.userId) {
      return { success: false, error: "ID de usuario no válido" };
    }

    // Check if the user exists in the database, if not create it
    // This ensures we won't violate foreign key constraints when creating an artist
    const user = await prisma.user.findUnique({
      where: {
        clerkId: authResult.userId,
      },
    });

    // If user doesn't exist in our database but exists in Clerk, create it
    if (!user) {
      // Use Clerk SDK to get user data
      try {
        // Create user with minimal data
        await prisma.user.create({
          data: {
            clerkId: authResult.userId,
            email: authResult.userId, // Use userId as temporary email - this will be updated later by the webhook
            role: "USER", // Default role
            status: "ACTIVE", // Set as active since they're already authenticated
          },
        });
      } catch {
        return { success: false, error: "Error al crear el usuario en la base de datos" };
      }
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

    // First determine which image (if any) will be the profile image
    let profileImageIdx = -1;
    let profileImagePublicId = null;

    if (validatedData.images && validatedData.images.length > 0) {
      if (validatedData.profileImageId) {
        // Find the index of the image with this public_id
        profileImageIdx = validatedData.images.findIndex(
          (img) => img.public_id === validatedData.profileImageId
        );
        // If we found a match, save the public_id
        if (profileImageIdx >= 0) {
          profileImagePublicId = validatedData.images[profileImageIdx].public_id;
        }
      }
    }

    // Create artist with images in a transaction
    const newArtist = await prisma.$transaction(async (tx) => {
      // Create the basic artist without profileImageId first
      const artist = await tx.artist.create({
        data: {
          name: validatedData.name,
          bio: validatedData.bio,
          origin: validatedData.origin,
          genres: validatedData.genres,
          slug,
          userId: user?.id, // Use the actual user ID from our database
          socialMedia: validatedData.socialMedia || {},
          // We don't set profileImageId yet
        },
      });

      // Add images if provided
      if (validatedData.images && validatedData.images.length > 0) {
        // Create all images
        await tx.image.createMany({
          data: validatedData.images.map((img) => ({
            url: img.url,
            alt: img.alt || validatedData.name,
            public_id: img.public_id,
            artistId: artist.id,
          })),
        });

        // If we had a profile image identified, save its public_id
        if (profileImagePublicId) {
          // Find the image we just created that has this public_id
          const profileImage = await tx.image.findFirst({
            where: {
              artistId: artist.id,
              public_id: profileImagePublicId,
            },
          });

          if (profileImage) {
            // Update the artist with the reference to the profile image
            await tx.artist.update({
              where: { id: artist.id },
              data: {
                profileImageId: profileImage.public_id,
              },
            });
          }
        }
      }

      // Retrieve the artist with all updated relations
      const updatedArtist = await tx.artist.findUnique({
        where: { id: artist.id },
        include: { images: true },
      });

      if (!updatedArtist) {
        throw new Error("Could not find artist after creating it");
      }

      return updatedArtist;
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

export async function updateArtist(artistId: string, data: ArtistInput) {
  try {
    // Validate data
    const validatedData = artistSchema.parse(data);

    // Get current user
    const authResult = await auth();

    if (!authResult.userId) {
      return { success: false, error: "No autenticado" };
    }

    // Check if the user ID in the data matches the current user
    if (authResult.userId !== validatedData.userId) {
      return { success: false, error: "ID de usuario no válido" };
    }

    // Verify the artist exists and belongs to this user
    const existingArtist = await prisma.artist.findFirst({
      where: {
        id: artistId,
        user: {
          clerkId: authResult.userId,
        },
      },
      include: { images: true },
    });

    if (!existingArtist) {
      return { success: false, error: "Artista no encontrado o no autorizado" };
    }

    // Generate slug from name if name has changed
    let slug = existingArtist.slug;
    if (existingArtist.name !== validatedData.name) {
      slug = slugify(validatedData.name);

      // Check if slug already exists for another artist
      const slugExists = await prisma.artist.findFirst({
        where: {
          slug,
          id: { not: artistId }, // Exclude current artist
        },
      });

      // If slug exists for another artist, append a random suffix
      if (slugExists) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    }

    // First determine which image (if any) will be the profile image
    const profileImagePublicId = validatedData.profileImageId;

    // Update artist and manage images in a transaction
    const updatedArtist = await prisma.$transaction(async (tx) => {
      // Update the basic artist data
      const artist = await tx.artist.update({
        where: { id: artistId },
        data: {
          name: validatedData.name,
          bio: validatedData.bio,
          origin: validatedData.origin,
          genres: validatedData.genres,
          slug,
          socialMedia: validatedData.socialMedia || {},
          profileImageId: profileImagePublicId,
        },
      });

      // Handle images update
      if (validatedData.images && validatedData.images.length > 0) {
        // Delete existing images that are not in the new set
        const newImagePublicIds = validatedData.images
          .map((img) => img.public_id)
          .filter((id): id is string => !!id);

        await tx.image.deleteMany({
          where: {
            artistId: artistId,
            public_id: {
              notIn: newImagePublicIds,
            },
          },
        });

        // Get existing image public_ids to avoid duplicates
        const existingImages = await tx.image.findMany({
          where: { artistId: artistId },
          select: { public_id: true },
        });
        const existingPublicIds = existingImages
          .map((img) => img.public_id)
          .filter((id): id is string => !!id);

        // Create only new images
        for (const img of validatedData.images) {
          if (img.public_id && !existingPublicIds.includes(img.public_id)) {
            await tx.image.create({
              data: {
                url: img.url,
                alt: img.alt || validatedData.name,
                public_id: img.public_id,
                artistId: artistId,
              },
            });
          }
        }
      } else {
        // If no images provided, keep existing ones
      }

      return artist;
    });

    return {
      success: true,
      artistId: updatedArtist.id,
    };
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

export async function deleteArtist(artistId: string) {
  try {
    // Get current user
    const authResult = await auth();

    if (!authResult.userId) {
      return { success: false, error: "No autenticado" };
    }

    // Verify the artist exists and belongs to this user
    const existingArtist = await prisma.artist.findFirst({
      where: {
        id: artistId,
        user: {
          clerkId: authResult.userId,
        },
      },
    });

    if (!existingArtist) {
      return { success: false, error: "Artista no encontrado o no autorizado" };
    }

    // Delete artist and related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related images first (due to foreign key constraints)
      await tx.image.deleteMany({
        where: { artistId: artistId },
      });

      // Delete the artist
      await tx.artist.delete({
        where: { id: artistId },
      });
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting artist:", error);
    return {
      success: false,
      error: "Error al eliminar el artista",
    };
  }
}
