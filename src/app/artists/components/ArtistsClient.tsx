"use client";

import { useCallback, useState } from "react";
import { Artist } from "@/types";
import { ArtistCard } from "./ArtistCard";
import { ArtistFilters } from "./ArtistFilters";

interface ArtistsClientProps {
  initialArtists: Artist[];
}

export function ArtistsClient({ initialArtists }: ArtistsClientProps) {
  const [filteredArtists, setFilteredArtists] = useState(initialArtists);

  // Use useCallback to memoize the filter function
  const handleFilterChange = useCallback(
    (filters: { genre: string | undefined; name: string }) => {
      let filtered = [...initialArtists];

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
    },
    [initialArtists]
  );

  return (
    <div className="grid gap-8 md:grid-cols-[300px_1fr]">
      <ArtistFilters onFilterChange={handleFilterChange} />

      {/* Artist List */}
      <div>
        <h2 className="sr-only">Lista de Artistas</h2>
        <div className="space-y-6">
          {filteredArtists.length > 0 ? (
            filteredArtists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)
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
  );
}
