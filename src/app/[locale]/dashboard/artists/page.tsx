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
import { getProfileImage } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export default async function ArtistsDashboardPage() {
  const t = await getTranslations("dashboard.artists");
  const commonT = await getTranslations("common");

  const authResult = await auth();
  const userId = authResult.userId;

  if (!userId) {
    redirect("/sign-in");
  }

  const artists = await getArtistsByUser(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-6">
        <h1 className="text-2xl font-bold">{t("myArtists")}</h1>
        <Button asChild>
          <Link href="/dashboard/artists/create">
            <Plus className="mr-2 h-4 w-4" />
            {t("addArtist")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 px-6 md:grid-cols-2 lg:grid-cols-3">
        {artists.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center px-8 py-12">
              <p className="text-muted-foreground mb-4 text-center">{t("noArtistsYet")}</p>
              <Button asChild>
                <Link href="/dashboard/artists/create">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addArtist")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          artists.map((artist) => {
            const profileImage = getProfileImage(artist.images, artist.profileImageId);

            return (
              <Card key={artist.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-4">
                    <div className="bg-muted relative h-12 w-12 overflow-hidden rounded-full">
                      {profileImage ? (
                        <Image
                          src={profileImage.url}
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
                          : t("noGenres")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">{t("biography")}</p>
                    <p className="text-muted-foreground line-clamp-3 text-sm">
                      {artist.bio || t("noBiography")}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href={`/artists/${artist.slug}`} target="_blank">
                      {t("viewProfile")}
                    </Link>
                  </Button>
                  <Button variant="default" asChild>
                    <Link href={`/dashboard/artists/create?artistId=${artist.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {commonT("edit")}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
