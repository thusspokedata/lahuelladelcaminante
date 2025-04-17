import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import Image from "next/image";

interface EventImage {
  url: string;
  alt: string;
}

interface EventCardProps {
  title: string;
  date: string;
  artist: string;
  genre: string;
  location: string;
  time: string;
  price?: number;
  images?: EventImage[];
}

export function EventCard({
  title,
  date,
  artist,
  genre,
  location,
  time,
  price,
  images = [],
}: EventCardProps) {
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
                className="object-cover rounded-md"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <ImagePlaceholder className="h-full" />
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold">{artist}</h3>
              <p className="text-muted-foreground">Género: {genre}</p>
              <p className="text-muted-foreground">Lugar: {location}</p>
              <p className="text-muted-foreground">Hora: {time}</p>
              {price && <p className="text-muted-foreground">Precio: €{price}</p>}
            </div>
            <Button className="self-start mt-4">Ver Detalles</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 