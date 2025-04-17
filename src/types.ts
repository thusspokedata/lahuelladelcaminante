export interface ArtistImage {
  url: string;
  alt: string;
}

export interface Artist {
  id: string;
  name: string;
  genres: string[];
  bio: string;
  origin: string;
  images?: ArtistImage[];
  socialMedia?: {
    instagram?: string;
    spotify?: string;
    youtube?: string;
    website?: string;
  };
  upcomingEvents?: string[];
}

export interface EventImage {
  url: string;
  alt: string;
}

export interface EventDate {
  date: string;
  dateObj: Date;
}

export interface Event {
  id: string;
  title: string;
  dates: EventDate[];
  artist: string;
  genre: string;
  location: string;
  time: string;
  price?: string | number;
  description?: string;
  images: EventImage[];
  // For events that have already gone through date processing
  date?: string;
  dateObj?: Date;
}
