import { getEventBySlug } from "@/services/events";
import { getArtistBySlug } from "@/services/artists";

type MetadataOptions = {
  title?: string;
  description?: string;
};

type EntityType = "event" | "artist";

/**
 * Generates dynamic metadata for different entity types
 * @param entityType - Type of entity ("event" or "artist")
 * @param params - Params object containing slug (as Promise in Next.js 15)
 * @param fallbackOptions - Fallback options if the entity is not found
 */
export async function generateEntityMetadata(
  entityType: EntityType,
  params: Promise<{ slug: string }> | { slug: string },
  fallbackOptions: MetadataOptions = {}
) {
  try {
    // Handle params as Promise or regular object
    const resolvedParams = params instanceof Promise ? await params : params;
    const slug = resolvedParams.slug;

    if (entityType === "event") {
      const event = await getEventBySlug(slug);
      if (event) {
        return {
          title: `${event.title} | La Huella del Caminante`,
          description: event.description || "Evento de música argentina en Berlín",
        };
      }
    } else if (entityType === "artist") {
      const artist = await getArtistBySlug(slug);
      if (artist) {
        return {
          title: `${artist.name} | La Huella del Caminante`,
          description: artist.bio ? artist.bio.substring(0, 160) : "Artista argentino en Berlín",
        };
      }
    }
  } catch (error) {
    console.error(`Error generating metadata for ${entityType}:`, error);
  }

  // Default values if the entity is not found or there's an error
  return {
    title: fallbackOptions.title || "La Huella del Caminante",
    description: fallbackOptions.description || "Música argentina en Berlín",
  };
}
