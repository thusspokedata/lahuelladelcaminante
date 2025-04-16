import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface EventCardProps {
  title: string;
  date: string;
  artist: string;
  genre: string;
  location: string;
  time: string;
  price?: number;
  imageUrl?: string;
}

export function EventCard({
  title,
  date,
  artist,
  genre,
  location,
  time,
  price,
  imageUrl,
}: EventCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{date}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="w-32 h-32 relative">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-md"></div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{artist}</h3>
            <p className="text-muted-foreground">Género: {genre}</p>
            <p className="text-muted-foreground">Lugar: {location}</p>
            <p className="text-muted-foreground">Hora: {time}</p>
            {price && <p className="text-muted-foreground">Precio: €{price}</p>}
            <Button className="mt-4">Ver Detalles</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 