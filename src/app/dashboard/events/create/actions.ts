"use server";

import { z } from "zod";
import { getCurrentUser, isActiveUser } from "@/services/auth";
import { prisma } from "@/lib/db";

// Validation schema for event creation
const eventSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres").max(100),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  organizerName: z.string().min(3, "El nombre del organizador debe tener al menos 3 caracteres"),
  location: z.string().min(3, "La ubicación debe tener al menos 3 caracteres"),
  time: z.string(),
  price: z.string(),
  genre: z.string().min(1, "Debes seleccionar un género"),
  artists: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      bio: z.string().optional(),
    })
  ),
  dates: z.array(z.date()).min(1, "Debes seleccionar al menos una fecha"),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().optional(),
        public_id: z.string().optional(),
      })
    )
    .optional(),
});

export type EventFormData = z.infer<typeof eventSchema>;

/**
 * Get artists created by the current user
 */
export async function getArtistsByUser(): Promise<{ id: string; name: string }[]> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("No se pudo obtener el usuario actual");
    }

    const artists = await prisma.artist.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return artists;
  } catch (error) {
    console.error("Error fetching artists:", error);
    throw new Error("No se pudieron cargar los artistas");
  }
}

/**
 * Create a quick artist with minimal information
 */
export async function createQuickArtist(name: string): Promise<{ id: string; name: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("No se pudo obtener el usuario actual");
    }

    const isActive = await isActiveUser();
    if (!isActive) {
      throw new Error("Tu cuenta no está activa");
    }

    // Create artist with minimal information
    const artist = await prisma.artist.create({
      data: {
        name,
        userId: user.id,
        slug: generateSlug(name),
        bio: "",
        origin: "",
        genres: [],
      },
      select: {
        id: true,
        name: true,
      },
    });

    return artist;
  } catch (error) {
    console.error("Error creating quick artist:", error);
    throw new Error("No se pudo crear el artista");
  }
}

/**
 * Create a new event
 */
export async function createEventHandler(
  data: EventFormData
): Promise<{ success: boolean; eventId: string }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("No se pudo obtener el usuario actual");
    }

    const isActive = await isActiveUser();
    if (!isActive) {
      throw new Error("Tu cuenta no está activa");
    }

    // Validate data with Zod
    const validatedData = eventSchema.parse(data);

    // Generate slug for the event
    const slug = generateSlug(validatedData.title);

    // Create temporary artists first if needed
    const artistIds = [];
    for (const artist of validatedData.artists) {
      // Check if it's a temporary ID
      if (artist.id.startsWith("temp-")) {
        // Create a new real artist in the database
        const newArtist = await prisma.artist.create({
          data: {
            name: artist.name,
            bio: artist.bio || "",
            slug: generateSlug(artist.name),
            origin: "", // Default value
            genres: [],
            userId: user.id,
          },
        });
        artistIds.push(newArtist.id);
      } else {
        // Use existing ID
        artistIds.push(artist.id);
      }
    }

    // Create base event
    const event = await prisma.event.create({
      data: {
        title: validatedData.title,
        slug,
        description: validatedData.description,
        location: validatedData.location,
        time: validatedData.time,
        // Convert to number if exists, or use null
        price: validatedData.price ? parseFloat(validatedData.price) : null,
        organizer: validatedData.organizerName,
        genre: validatedData.genre,
        createdBy: {
          connect: { id: user.id },
        },
        // Connect with first artist if exists
        artist: artistIds.length > 0 ? { connect: { id: artistIds[0] } } : undefined,
      },
    });

    // Create dates separately
    for (const date of validatedData.dates) {
      await prisma.eventDate.create({
        data: {
          date,
          eventId: event.id,
        },
      });
    }

    // If there are images, save them associated with the event
    if (validatedData.images && validatedData.images.length > 0) {
      await Promise.all(
        validatedData.images.map((image) =>
          prisma.image.create({
            data: {
              url: image.url,
              alt: image.alt || validatedData.title,
              public_id: image.public_id,
              event: {
                connect: { id: event.id },
              },
            },
          })
        )
      );
    }

    return { success: true, eventId: event.id };
  } catch (error) {
    console.error("Error creating event:", error);
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(firstError.message);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error al crear el evento");
  }
}

// Function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, "-");
}
