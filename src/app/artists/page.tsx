"use client";

import { ArtistCard } from "@/components/ArtistCard";
import { ArtistFilters } from "@/components/ArtistFilters";
import { useState } from "react";

// Example artist data
const mockArtists = [
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
  },
];

export default function ArtistsPage() {
  const [filteredArtists, setFilteredArtists] = useState(mockArtists);

  const handleFilterChange = (filters: { genre: string | undefined; name: string }) => {
    let filtered = [...mockArtists];

    if (filters.genre) {
      filtered = filtered.filter((artist) => artist.genres.includes(filters.genre as string));
    }

    if (filters.name) {
      filtered = filtered.filter((artist) =>
        artist.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    // Sort alphabetically
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredArtists(filtered);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div>
          <h1 className="mb-2 text-4xl font-bold">Artistas</h1>
          <p className="text-muted-foreground text-xl">
            Conoce a los artistas argentinos que actúan en Berlín
          </p>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        <ArtistFilters onFilterChange={handleFilterChange} />

        {/* Artist List */}
        <div>
          <h2 className="sr-only">Lista de Artistas</h2>
          <div className="space-y-6">
            {filteredArtists.length > 0 ? (
              filteredArtists.map((artist) => <ArtistCard key={artist.id} {...artist} />)
            ) : (
              <div className="rounded-lg border p-8 text-center">
                <h3 className="text-lg font-medium">No se encontraron artistas</h3>
                <p className="text-muted-foreground mt-2">
                  Intenta con otros filtros o elimina las restricciones de búsqueda.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
