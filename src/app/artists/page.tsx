"use client";

import { ArtistCard } from "@/components/ArtistCard";
import { ArtistFilters } from "@/components/ArtistFilters";
import { useCallback, useState } from "react";
import { mockArtists } from "@/mockData";

export default function ArtistsPage() {
  const [filteredArtists, setFilteredArtists] = useState(mockArtists);

  // Use useCallback to memoize the filter function
  const handleFilterChange = useCallback((filters: { genre: string | undefined; name: string }) => {
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
  }, []);

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
