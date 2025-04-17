import { ArtistsClient } from "@/components/ArtistsClient";
import { mockArtists } from "@/mockData";

export default function ArtistsPage() {
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

      {/* Client component handles all interactive functionality */}
      <ArtistsClient initialArtists={mockArtists} />
    </div>
  );
}
