export interface ArtistImage {
  url: string;
  alt: string;
  public_id?: string;
}

/**
 * Tipo que define los idiomas soportados por la aplicación
 */
export type SupportedLocale = "es" | "en" | "de";

export interface Artist {
  id: string;
  name: string;
  slug: string;
  genres: string[];
  bio: string;
  origin: string;
  images?: ArtistImage[];
  profileImageId?: string | null;
  socialMedia?: {
    instagram?: string;
    spotify?: string;
    youtube?: string;
    website?: string;
    tiktok?: string;
  };
  upcomingEvents?: string[];
  createdAt?: string;
  updatedAt?: string;
  userId?: string | null;
}

export interface EventImage {
  url: string;
  alt: string;
}

export interface EventDate {
  date: string | Date;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  dates: EventDate[];
  organizer: string;
  artist: {
    id: string;
    name: string;
    slug: string;
  };
  genre: string;
  location: string;
  time: string;
  price?: string | number;
  description?: string;
  images: EventImage[];
  // For events that have already gone through date processing
  date?: string | Date;
}
