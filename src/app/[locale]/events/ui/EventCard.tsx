import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

interface EventImage {
  url: string;
  alt: string;
}

interface EventCardProps {
  id: string;
  title: string;
  slug: string;
  date: string;
  artist: string;
  organizer: string;
  genre: string;
  location: string;
  time: string;
  price?: number;
  images?: EventImage[];
}

export function EventCard({
  title,
  slug,
  date,
  artist,
  organizer,
  genre,
  location,
  time,
  price,
  images = [],
}: EventCardProps) {
  const t = useTranslations("events.card");
  const locale = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{date}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="relative w-48">
            {images.length > 0 ? (
              <Image
                src={images[0].url}
                alt={images[0].alt}
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
              <h3 className="text-xl font-semibold">{artist}</h3>
              <p className="font-semibold">
                {t("organizedBy")}: {organizer}
              </p>
              <p className="text-muted-foreground">
                {t("genre")}: {genre}
              </p>
              <p className="text-muted-foreground">
                {t("location")}: {location}
              </p>
              <p className="text-muted-foreground">
                {t("time")}: {time}
              </p>
              {price && (
                <p className="text-muted-foreground">
                  {t("price")}: €{price}
                </p>
              )}
            </div>
            <Link href={`/${locale}/events/${slug}`}>
              <Button className="mt-4">{t("viewDetails")}</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
