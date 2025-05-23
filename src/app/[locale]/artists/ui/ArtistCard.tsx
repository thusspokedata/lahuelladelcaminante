import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { Artist } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { getProfileImage } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const t = useTranslations("artists");
  const { name, genres = [], bio, origin, images = [], socialMedia, slug, profileImageId } = artist;

  const profileImage = getProfileImage(images, profileImageId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{genres?.join(", ") || t("noGenres")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="relative h-40 w-40 shrink-0">
            {profileImage ? (
              <Image
                src={profileImage.url}
                alt={profileImage.alt}
                className="rounded-md object-cover"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <ImagePlaceholder className="h-full" />
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <p className="mb-2 line-clamp-3">{bio}</p>
              <p className="text-muted-foreground">
                {t("origin")}: {origin}
              </p>

              {socialMedia && Object.values(socialMedia).some(Boolean) && (
                <div className="mt-2">
                  <p className="text-sm font-medium">{t("socialMedia")}:</p>
                  <div className="mt-1 flex space-x-2">
                    {socialMedia.instagram && (
                      <a
                        href={socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Instagram
                      </a>
                    )}
                    {socialMedia.spotify && (
                      <a
                        href={socialMedia.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:underline"
                      >
                        Spotify
                      </a>
                    )}
                    {socialMedia.youtube && (
                      <a
                        href={socialMedia.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:underline"
                      >
                        YouTube
                      </a>
                    )}
                    {socialMedia.website && (
                      <a
                        href={socialMedia.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:underline"
                      >
                        {t("website")}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link href={`/artists/${slug}`}>
              <Button className="mt-4">{t("viewProfile")}</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
