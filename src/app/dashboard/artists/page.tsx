import { auth } from "@clerk/nextjs/server";
import { getArtistsByUser } from "@/services/artists";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pencil, Plus } from "lucide-react";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import Image from "next/image";

export default async function ArtistsDashboardPage() {
  const authResult = await auth();
  const userId = authResult.userId;

  if (!userId) {
    redirect("/sign-in");
  }

  const artists = await getArtistsByUser(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Artistas</h1>
        <Button asChild>
          <Link href="/dashboard/artists/create">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Artista
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {artists.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No has creado ningún artista todavía.
              </p>
            </CardContent>
          </Card>
        ) : (
          artists.map((artist) => (
            <Card key={artist.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="bg-muted relative h-12 w-12 overflow-hidden rounded-full">
                    {artist.images && artist.images.length > 0 ? (
                      <Image
                        src={artist.images[0].url}
                        alt={artist.name}
                        className="object-cover"
                        fill
                        sizes="48px"
                      />
                    ) : (
                      <ImagePlaceholder className="h-full w-full" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{artist.name}</CardTitle>
                    <CardDescription>
                      {artist.genres && artist.genres.length > 0
                        ? artist.genres.join(", ")
                        : "Sin géneros"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Biografía</p>
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {artist.bio || "Sin biografía"}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/artists/${artist.slug}`} target="_blank">
                    Ver Perfil
                  </Link>
                </Button>
                <Button variant="default" asChild>
                  <Link href={`/dashboard/artists/${artist.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8">
        <Button asChild>
          <Link href="/dashboard/artists/create">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Artista
          </Link>
        </Button>
      </div>
    </div>
  );
}
