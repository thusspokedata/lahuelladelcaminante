import { auth } from "@clerk/nextjs/server";
import { getArtistById } from "@/services/artists";
import { notFound, redirect } from "next/navigation";
import ArtistForm from "./ArtistForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";

// Helper function to check if a user owns an artist
async function userOwnsArtist(userId: string, artistId: string): Promise<boolean> {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { userId: true },
  });

  return !!artist && artist.userId === userId;
}

type Params = Promise<{ id: string }>;

export default async function EditArtistPage({ params }: { params: Params }) {
  const { id } = await params;
  const authResult = await auth();

  if (!authResult.userId) {
    redirect("/sign-in");
  }

  // Get artist data
  const artist = await getArtistById(id);

  if (!artist) {
    notFound();
  }

  // Verify ownership
  const ownsArtist = await userOwnsArtist(authResult.userId, id);
  if (!ownsArtist) {
    redirect("/dashboard/artists");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar Artista</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/artists">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <div className="mx-auto max-w-3xl">
        <ArtistForm artist={artist} />
      </div>
    </div>
  );
}
