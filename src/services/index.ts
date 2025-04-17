import { getArtistById } from "./artists";
import { getEventById, getEventsByArtistId } from "./events";
import type { Artist } from "./artists";
import type { Event } from "./events";

// Re-export types and services
export type { Artist, Event };

// Helper function to find artist by event (replacement for mockData function)
export async function findArtistByEvent(eventId: string): Promise<Artist | undefined> {
  const event = await getEventById(eventId);
  if (!event) return undefined;

  // Get event's artist using the artist name
  const artistName = event.artist;
  const artist = await getArtistById(artistName);

  return artist || undefined;
}

// Helper function to find events by artist (replacement for mockData function)
export async function findEventsByArtist(artistId: string): Promise<Event[]> {
  return getEventsByArtistId(artistId);
}
