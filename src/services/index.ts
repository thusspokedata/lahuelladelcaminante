import { getArtistById } from "./artists";
import { getEventsByArtistId } from "./events";
import type { Artist } from "./artists";
import type { Event } from "./events";
import { prisma } from "@/lib/db";

// Re-export types and services
export type { Artist, Event };

// Re-export specific services to avoid naming conflicts
export * from "./artists";
export * from "./events";
// Avoid re-exporting auth.ts directly as it contains getAllUsers which conflicts with users.ts
export * from "./cloudinary";

// Re-export from auth.ts except getAllUsers
export {
  getCurrentUser,
  hasRole,
  isActiveUser,
  isPendingUser,
  isBlockedUser,
  canPerformAction,
  updateUserStatus,
  updateUserRole,
  getPendingUsers,
} from "./auth";

// Re-export from users.ts
export * from "./users";

// Helper function to find artist by event (replacement for mockData function)
export async function findArtistByEvent(eventId: string): Promise<Artist | undefined> {
  try {
    // Get full event with artist relation from the database
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { artist: true },
    });

    if (!event || !event.artistId) return undefined;

    // Get artist by ID
    const artist = await getArtistById(event.artistId);
    return artist || undefined;
  } catch (error) {
    console.error("Error finding artist by event:", error);
    return undefined;
  }
}

// Helper function to find events by artist (replacement for mockData function)
export async function findEventsByArtist(artistId: string): Promise<Event[]> {
  return getEventsByArtistId(artistId);
}
