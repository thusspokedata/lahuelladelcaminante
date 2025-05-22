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

// Get event by id for editing
export async function getEventById(eventId: string) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("No se pudo obtener el usuario actual");
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: {
          id: user.id,
        },
      },
      include: {
        dates: {
          orderBy: {
            date: "asc",
          },
        },
        artist: {
          select: {
            id: true,
            name: true,
            bio: true,
          },
        },
        images: true,
      },
    });

    if (!event) {
      throw new Error("Evento no encontrado o no tienes permiso para editarlo");
    }

    return {
      id: event.id,
      title: event.title,
      description: event.description || "",
      organizerName: event.organizer,
      location: event.location,
      time: event.time,
      price: event.price?.toString() || "",
      genre: event.genre,
      artists: event.artist
        ? [{ id: event.artist.id, name: event.artist.name, bio: event.artist.bio || "" }]
        : [],
      dates: event.dates.map((date) => date.date),
      images: event.images.map((img) => ({
        url: img.url,
        alt: img.alt,
        public_id: img.public_id || undefined,
      })),
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    throw new Error("No se pudo cargar el evento");
  }
}

/**
 * Update an existing event
 */
export async function updateEventHandler(
  eventId: string,
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

    // Verify the user has permission to edit this event
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: {
          id: user.id,
        },
      },
    });

    if (!existingEvent) {
      throw new Error("Evento no encontrado o no tienes permiso para editarlo");
    }

    // Validate data with Zod
    const validatedData = eventSchema.parse(data);

    // First handle the artist connection
    const artistId = validatedData.artists.length > 0 ? validatedData.artists[0].id : null;

    // Update the event in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the base event data
      await tx.event.update({
        where: { id: eventId },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          location: validatedData.location,
          time: validatedData.time,
          price: validatedData.price ? parseFloat(validatedData.price) : null,
          organizer: validatedData.organizerName,
          genre: validatedData.genre,
          artistId: artistId, // Connect to the first artist, or null if none
        },
      });

      // Update dates - delete old ones and create new ones
      await tx.eventDate.deleteMany({
        where: { eventId },
      });

      await Promise.all(
        validatedData.dates.map((date) =>
          tx.eventDate.create({
            data: {
              date,
              eventId,
            },
          })
        )
      );

      // Update images - delete old ones that are not in the new set and add new ones
      if (validatedData.images && validatedData.images.length > 0) {
        // Get existing image public_ids to identify which need to be kept
        const existingImages = await tx.image.findMany({
          where: { eventId },
          select: { public_id: true },
        });

        const existingPublicIds = existingImages
          .map((img) => img.public_id)
          .filter((id): id is string => !!id);

        // Get the public_ids from the incoming images
        const incomingPublicIds = validatedData.images
          .map((img) => img.public_id)
          .filter((id): id is string => !!id);

        // Delete images that don't exist in the incoming set
        await tx.image.deleteMany({
          where: {
            eventId,
            public_id: {
              notIn: incomingPublicIds,
            },
          },
        });

        // Add only new images (those not already in the database)
        for (const image of validatedData.images) {
          if (image.public_id && !existingPublicIds.includes(image.public_id)) {
            await tx.image.create({
              data: {
                url: image.url,
                alt: image.alt || validatedData.title,
                public_id: image.public_id,
                eventId,
              },
            });
          }
        }
      } else {
        // If no images provided, delete all existing images
        await tx.image.deleteMany({
          where: { eventId },
        });
      }
    });

    return { success: true, eventId };
  } catch (error) {
    console.error("Error updating event:", error);

    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => `${e.path}: ${e.message}`).join(", ");
      throw new Error(`Validation error: ${errorMessage}`);
    }

    throw new Error(error instanceof Error ? error.message : "Error al actualizar el evento");
  }
}

/**
 * Delete an event (soft delete)
 */
export async function deleteEventHandler(eventId: string): Promise<{ success: boolean }> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("No se pudo obtener el usuario actual");
    }

    // Verify the user has permission to delete this event
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: {
          id: user.id,
        },
      },
    });

    if (!existingEvent) {
      throw new Error("Evento no encontrado o no tienes permiso para eliminarlo");
    }

    // Soft delete the event
    await prisma.event.update({
      where: { id: eventId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error(error instanceof Error ? error.message : "Error al eliminar el evento");
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
