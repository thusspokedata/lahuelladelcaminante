// src/mockData.ts - Unified mock data for both artists and events

export interface Event {
  id: string;
  title: string;
  dates: {
    date: string;
    dateObj: Date;
  }[];
  artist: string;
  genre: string;
  location: string;
  time: string;
  price?: number;
  description?: string;
  images: {
    url: string;
    alt: string;
  }[];
}

export interface Artist {
  id: string;
  name: string;
  genres: string[];
  bio: string;
  origin: string;
  images: {
    url: string;
    alt: string;
  }[];
  socialMedia?: {
    instagram?: string;
    spotify?: string;
    youtube?: string;
    website?: string;
  };
  upcomingEvents?: string[]; // References to event IDs
}

// Artists data
export const mockArtists: Artist[] = [
  {
    id: "1",
    name: "Los Toch",
    genres: ["folklore", "reggae", "rock", "cumbia"],
    bio: "Banda cordobesa con más de 15 años de experiencia en la escena musical argentina. Con una atípica formación de bandoneón, bajo y batería, el grupo expresa una mezcla única donde conviven reggae, rock, folklore y cumbia. Su música refleja la esencia artesanal y el espíritu independiente.",
    origin: "Córdoba, Argentina",
    images: [
      {
        url: "paew5aeymxo9tdgvarlr",
        alt: "Los Toch en concierto",
      },
    ],
    socialMedia: {
      instagram: "https://www.instagram.com/_t_o_c_h_",
      spotify: "",
      youtube: "",
    },
    upcomingEvents: ["7"],
  },
];

// Events data
export const mockEvents: Event[] = [
  {
    id: "7",
    title: "Los Toch en Berlín",
    dates: [
      {
        date: "Miércoles 17 de Julio, 2025",
        dateObj: new Date(2025, 6, 17, 0, 0, 0),
      },
    ],
    artist: "Los Toch",
    genre: "folklore",
    location: "Bar Rotbart",
    time: "21:00",
    price: 18,
    description:
      "La banda cordobesa Los Toch presenta su espectáculo único que fusiona reggae, rock, folklore y cumbia en una noche imperdible. Con una combinación poco usual de bandoneón, bajo y batería, la banda promete un viaje musical a través de diversos ritmos latinoamericanos.",
    images: [
      {
        url: "https://picsum.photos/seed/toch2/400/300",
        alt: "Los Toch tocando en vivo",
      },
    ],
  },
];

// Helper function to find artist by event
export function findArtistByEvent(eventId: string): Artist | undefined {
  const event = mockEvents.find((event) => event.id === eventId);
  if (!event) return undefined;

  return mockArtists.find((artist) => artist.name === event.artist);
}

// Helper function to find events by artist
export function findEventsByArtist(artistId: string): Event[] {
  const artist = mockArtists.find((artist) => artist.id === artistId);
  if (!artist) return [];

  return mockEvents.filter((event) => event.artist === artist.name);
}
