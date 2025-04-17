import { ArtistsClient } from "./ui";
import { getAllArtists } from "@/services/artists";

export default async function ArtistsPage() {
  // Fetch artists from database
  const artists = await getAllArtists();

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
      <ArtistsClient initialArtists={artists} />
    </div>
  );
}
