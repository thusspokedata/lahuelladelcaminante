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
    name: "Tango Argentino Berlin",
    genres: ["tango"],
    bio: "Grupo de tango tradicional con más de 10 años de experiencia en la escena berlinesa. Ofrecen shows auténticos que transportan al público a las calles de Buenos Aires.",
    origin: "Berlin/Buenos Aires",
    images: [
      {
        url: "https://picsum.photos/seed/tango1/400/300",
        alt: "Tango Argentino Berlin en concierto",
      },
    ],
    socialMedia: {
      instagram: "https://instagram.com/tangoargentinoberlin",
      spotify: "https://open.spotify.com/artist/example",
      website: "https://tangoargentinoberlin.de",
    },
    upcomingEvents: ["1"],
  },
  {
    id: "2",
    name: "Los Hermanos del Sur",
    genres: ["folklore"],
    bio: "Dúo de hermanos originarios de Mendoza que fusionan el folklore tradicional con influencias contemporáneas. Sus presentaciones incluyen danzas tradicionales argentinas.",
    origin: "Mendoza, Argentina",
    images: [
      {
        url: "https://picsum.photos/seed/folklore1/400/300",
        alt: "Los Hermanos del Sur tocando en vivo",
      },
    ],
    socialMedia: {
      instagram: "https://instagram.com/hermanosdelsur",
      youtube: "https://youtube.com/hermanosdelsuroficial",
    },
    upcomingEvents: ["2"],
  },
  {
    id: "3",
    name: "Los Pibes del Rock",
    genres: ["rock"],
    bio: "Banda de rock argentino establecida en Berlín desde 2018. Su música combina el sonido clásico del rock nacional argentino con letras que hablan de la experiencia migrante.",
    origin: "Buenos Aires/Berlin",
    images: [
      {
        url: "https://picsum.photos/seed/rock1/400/300",
        alt: "Los Pibes del Rock en concierto",
      },
    ],
    socialMedia: {
      instagram: "https://instagram.com/pibesdelrock",
      spotify: "https://open.spotify.com/artist/example2",
    },
    upcomingEvents: ["3"],
  },
  {
    id: "4",
    name: "Milena Salamanca",
    genres: ["folklore", "fusion"],
    bio: "Cantautora argentina radicada en Berlín desde 2015. Su música fusiona el folklore argentino con elementos de jazz y música electrónica, creando un sonido único.",
    origin: "Córdoba, Argentina",
    images: [
      {
        url: "https://picsum.photos/seed/milena1/400/300",
        alt: "Milena Salamanca en estudio",
      },
    ],
    socialMedia: {
      instagram: "https://instagram.com/milenasalamanca",
      spotify: "https://open.spotify.com/artist/example3",
      youtube: "https://youtube.com/milenasalamancamusic",
      website: "https://milenasalamanca.com",
    },
    upcomingEvents: ["4"],
  },
  {
    id: "5",
    name: "Pablo Campos",
    genres: ["tango", "jazz"],
    bio: "Pianista y compositor que explora la intersección entre el tango y el jazz. Ha colaborado con numerosos artistas de la escena musical berlinesa y argentina.",
    origin: "Rosario, Argentina",
    images: [
      {
        url: "https://picsum.photos/seed/piano1/400/300",
        alt: "Pablo Campos tocando el piano",
      },
    ],
    upcomingEvents: [],
  },
  {
    id: "6",
    name: "La Berlineña",
    genres: ["cumbia", "electronica"],
    bio: "Proyecto musical que fusiona cumbia argentina con música electrónica berlinesa. Sus energéticos shows son conocidos por hacer bailar al público toda la noche.",
    origin: "Berlin",
    images: [
      {
        url: "https://picsum.photos/seed/cumbia1/400/300",
        alt: "La Berlineña en vivo",
      },
    ],
    socialMedia: {
      instagram: "https://instagram.com/laberlinena",
      spotify: "https://open.spotify.com/artist/example4",
    },
    upcomingEvents: [],
  },
  {
    id: "7",
    name: "Cuarteto Austral",
    genres: ["tango", "clasica"],
    bio: "Cuarteto de cuerdas especializado en tango de cámara y música contemporánea argentina. Realizan interpretaciones únicas de obras clásicas y modernas.",
    origin: "Berlin/Buenos Aires",
    images: [
      {
        url: "https://picsum.photos/seed/cuarteto1/400/300",
        alt: "Cuarteto Austral en concierto",
      },
    ],
    socialMedia: {
      website: "https://cuartetoaustral.com",
    },
    upcomingEvents: [],
  },
  {
    id: "8",
    name: "Los Toch",
    genres: ["folklore", "reggae", "rock", "cumbia"],
    bio: "Banda cordobesa con más de 15 años de experiencia en la escena musical argentina. Con una atípica formación de bandoneón, bajo y batería, el grupo expresa una mezcla única donde conviven reggae, rock, folklore y cumbia. Su música refleja la esencia artesanal y el espíritu independiente.",
    origin: "Córdoba, Argentina",
    images: [
      {
        url: "https://picsum.photos/seed/toch1/400/300",
        alt: "Los Toch en concierto",
      },
    ],
    socialMedia: {
      instagram: "https://instagram.com/lostochoficial",
      spotify: "https://open.spotify.com/artist/lostoch",
      youtube: "https://youtube.com/lostochoficial",
    },
    upcomingEvents: ["7"],
  },
  {
    id: "9",
    name: "Demi Carabajal",
    genres: ["folklore", "chacarera"],
    bio: "Músico de folclore argentino oriundo de La Banda, Santiago del Estero. Hijo del reconocido folclorista Carlos Carabajal y hermano de Peteco Carabajal. Su verdadero nombre es Raúl Fernando Carabajal, nacido en 1972. Tiene excelentes habilidades como guitarrista y percusionista, formando parte del legendario Clan Carabajal, conocida como 'la más grande del folklore'.",
    origin: "Santiago del Estero, Argentina",
    images: [
      {
        url: "https://picsum.photos/seed/demi1/400/300",
        alt: "Demi Carabajal en vivo",
      },
    ],
    socialMedia: {
      instagram: "https://instagram.com/demicarabajal",
      youtube: "https://youtube.com/demicarabajal",
    },
    upcomingEvents: ["8"],
  },
];

// Events data
export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Noche de Tango",
    dates: [
      {
        date: "Viernes 19 de Abril, 2025",
        dateObj: new Date(2025, 3, 19, 0, 0, 0),
      },
      {
        date: "Miércoles 23 de Abril, 2025",
        dateObj: new Date(2025, 3, 23, 0, 0, 0),
      },
    ],
    artist: "Tango Argentino Berlin",
    genre: "tango",
    location: "Café Tango",
    time: "20:00",
    price: 15,
    description:
      "Una noche mágica con la mejor música de tango interpretada por los maestros de Tango Argentino Berlin. La velada incluirá demostraciones de baile por bailarines profesionales.",
    images: [
      {
        url: "https://picsum.photos/seed/tango1/400/300",
        alt: "Pareja bailando tango",
      },
      {
        url: "https://picsum.photos/seed/tango2/400/300",
        alt: "Músicos de tango",
      },
    ],
  },
  {
    id: "2",
    title: "Folklore en Berlín",
    dates: [
      {
        date: "Sábado 20 de Abril, 2025",
        dateObj: new Date(2025, 3, 20, 0, 0, 0),
      },
    ],
    artist: "Los Hermanos del Sur",
    genre: "folklore",
    location: "La Peña",
    time: "21:00",
    price: 12,
    description:
      "Una noche auténtica de folklore argentino con Los Hermanos del Sur. Disfruta de chacareras, zambas y gatos en un ambiente familiar y acogedor.",
    images: [
      {
        url: "https://picsum.photos/seed/folklore1/400/300",
        alt: "Grupo de folklore en escenario",
      },
    ],
  },
  {
    id: "3",
    title: "Rock Argentino",
    dates: [
      {
        date: "Domingo 21 de Abril, 2025",
        dateObj: new Date(2025, 3, 21, 0, 0, 0),
      },
    ],
    artist: "Los Pibes del Rock",
    genre: "rock",
    location: "Rock Bar",
    time: "19:00",
    price: 10,
    description:
      "La mejor noche de rock argentino en Berlín. Los Pibes del Rock traen la energía del rock nacional con un toque berlinés. No te lo pierdas!",
    images: [
      {
        url: "https://picsum.photos/seed/rock1/400/300",
        alt: "Banda de rock en vivo",
      },
      {
        url: "https://picsum.photos/seed/rock2/400/300",
        alt: "Público en concierto de rock",
      },
    ],
  },
  {
    id: "4",
    title: "Noche de Chacarera",
    dates: [
      {
        date: "Viernes 26 de Abril, 2025",
        dateObj: new Date(2025, 3, 26, 0, 0, 0),
      },
    ],
    artist: "Milena Salamanca",
    genre: "folklore",
    location: "Kulturhaus",
    time: "20:30",
    price: 15,
    description:
      "Milena Salamanca presenta un espectáculo único de chacareras y otros ritmos folklóricos argentinos fusionados con elementos contemporáneos. Una experiencia musical inolvidable.",
    images: [
      {
        url: "https://picsum.photos/seed/milena1/400/300",
        alt: "Milena Salamanca en concierto",
      },
      {
        url: "https://picsum.photos/seed/milena2/400/300",
        alt: "Bailarines de chacarera",
      },
    ],
  },
  {
    id: "5",
    title: "Peteco en Berlín",
    dates: [
      {
        date: "Sábado 27 de Abril, 2025",
        dateObj: new Date(2025, 3, 27, 0, 0, 0),
      },
    ],
    artist: "Peteco Carabajal",
    genre: "folklore",
    location: "Theater am Potsdamer Platz",
    time: "21:00",
    price: 25,
    description:
      "El legendario Peteco Carabajal llega a Berlín para un concierto exclusivo. Una oportunidad única para disfrutar del mejor folklore argentino contemporáneo.",
    images: [],
  },
  {
    id: "6",
    title: "Folklore Contemporáneo",
    dates: [
      {
        date: "Domingo 28 de Abril, 2025",
        dateObj: new Date(2025, 3, 28, 0, 0, 0),
      },
    ],
    artist: "Clara Cantore",
    genre: "folklore",
    location: "Passionskirche",
    time: "19:30",
    price: 18,
    description:
      "Clara Cantore presenta su nuevo repertorio de folklore contemporáneo, con canciones originales y versiones de clásicos argentinos renovados para el público europeo.",
    images: [
      {
        url: "https://picsum.photos/seed/clara1/400/300",
        alt: "Clara Cantore tocando la guitarra",
      },
      {
        url: "https://picsum.photos/seed/clara2/400/300",
        alt: "Ensamble de música folklórica",
      },
    ],
  },
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
  {
    id: "8",
    title: "DEMI CARABAJAL en BERLÍN",
    dates: [
      {
        date: "Domingo 4 de Mayo, 2025",
        dateObj: new Date(2025, 4, 4, 0, 0, 0),
      },
    ],
    artist: "Demi Carabajal",
    genre: "folklore",
    location: "Begegnungsstätte Falkensteinstr",
    time: "14:00",
    price: 15,
    description:
      "Un domingo voller Chacarera, Guaracha und Cumbia! Demi Carabajal presenta un espectáculo de música folklórica argentina en Berlín. Tanz, Musik und pure lateinamerikanische Lebensfreude. ¡No te lo pierdas!",
    images: [
      {
        url: "https://picsum.photos/seed/demi2/400/300",
        alt: "Demi Carabajal en concierto",
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
