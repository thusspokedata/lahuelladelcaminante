"use client";

import { useCallback, useState } from "react";
import { Artist } from "@/types";
import { ArtistCard } from "./ArtistCard";
import { ArtistFilters } from "./ArtistFilters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Info } from "lucide-react";
import Link from "next/link";

interface ArtistsClientProps {
  initialArtists: Artist[];
}

export function ArtistsClient({ initialArtists }: ArtistsClientProps) {
  const [filteredArtists, setFilteredArtists] = useState(initialArtists);

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

  // If there are no initial artists at all, show a welcome/empty state
  if (initialArtists.length === 0) {
    return (
      <Card className="p-8">
        <CardContent className="flex flex-col items-center justify-center space-y-6 pt-6 text-center">
          <Music className="text-primary/70 h-16 w-16" />
          <h3 className="text-2xl font-semibold">Próximamente nuevos artistas</h3>
          <p className="text-muted-foreground max-w-md">
            Estamos preparando perfiles de los artistas argentinos en Berlín. Vuelve pronto para
            descubrir talentos.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Button variant="outline" asChild>
              <Link href="/events">
                <Info className="mr-2 h-4 w-4" />
                Ver eventos
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/about">
                <Info className="mr-2 h-4 w-4" />
                Sobre nosotros
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="mb-2 text-lg font-medium">No se encontraron artistas</h3>
                <p className="text-muted-foreground mb-4">
                  Intenta con otros filtros o elimina las restricciones de búsqueda.
                </p>
                <Button
                  variant="outline"
                  onClick={() => handleFilterChange({ genre: undefined, name: "" })}
                >
                  Limpiar filtros
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
