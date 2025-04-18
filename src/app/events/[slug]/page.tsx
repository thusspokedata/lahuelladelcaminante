import { getEventBySlug } from "@/services/events";
import { getArtistById } from "@/services/artists";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  TicketIcon,
  MusicIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { formatDateWithWeekday } from "@/lib/utils";

export default async function EventDetails({ params }: { params: Promise<{ slug: string }> }) {
  // Await params to access its properties
  const resolvedParams = await params;
  const eventSlug = resolvedParams.slug;

  console.log("Looking for event with slug:", eventSlug);

  // Fetch data on the server
  let event = null;
  let artist = null;

  try {
    event = await getEventBySlug(eventSlug);
    if (event) {
      if (event.artist) {
        artist = await getArtistById(event.artist.id);
      }
    }
  } catch (error) {
    console.error("Error fetching event data:", error);
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Evento no encontrado</h1>
          <p className="mb-6">No pudimos encontrar el evento que estás buscando.</p>
          <Link href="/events">
            <Button>Ver todos los eventos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/events"
        className="text-muted-foreground hover:text-foreground mb-4 flex items-center"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Volver a eventos
      </Link>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        {/* Event Details */}
        <div className="space-y-6">
          <div>
            <h1 className="mb-2 text-4xl font-bold">{event.title}</h1>
            {event.artist && <p className="text-muted-foreground text-xl">{event.artist.name}</p>}
          </div>

          {/* Event Image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            {event.images && event.images.length > 0 ? (
              <Image
                src={event.images[0].url}
                alt={event.images[0].alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center">
                <MusicIcon className="text-muted-foreground h-24 w-24" />
              </div>
            )}
          </div>

          {/* Event Description */}
          <Card>
            <CardHeader>
              <CardTitle>Sobre este evento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">
                {event.description || "No hay descripción disponible para este evento."}
              </p>
            </CardContent>
          </Card>

          {/* Gallery */}
          {event.images && event.images.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Galería</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {event.images.slice(1).map((image, index) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-md">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date */}
              <div className="flex items-start">
                <CalendarIcon className="text-muted-foreground mt-0.5 mr-3 h-5 w-5" />
                <div>
                  <p className="font-medium">Fechas</p>
                  <ul className="text-muted-foreground">
                    {event.dates.map((d, idx) => (
                      <li key={idx}>{formatDateWithWeekday(d.date)}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start">
                <ClockIcon className="text-muted-foreground mt-0.5 mr-3 h-5 w-5" />
                <div>
                  <p className="font-medium">Hora</p>
                  <p className="text-muted-foreground">{event.time}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start">
                <MapPinIcon className="text-muted-foreground mt-0.5 mr-3 h-5 w-5" />
                <div>
                  <p className="font-medium">Lugar</p>
                  <p className="text-muted-foreground">{event.location}</p>
                </div>
              </div>

              {/* Price */}
              {event.price !== undefined && (
                <div className="flex items-start">
                  <TicketIcon className="text-muted-foreground mt-0.5 mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium">Precio</p>
                    <p className="text-muted-foreground">€{event.price}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Artist Info */}
          {artist && (
            <Card>
              <CardHeader>
                <CardTitle>Acerca del artista</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full">
                    {artist.images && artist.images.length > 0 ? (
                      <Image
                        src={artist.images[0].url}
                        alt={artist.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="bg-muted flex h-full w-full items-center justify-center">
                        <MusicIcon className="text-muted-foreground h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{artist.name}</h3>
                    <p className="text-muted-foreground text-sm">{artist.origin}</p>
                  </div>
                </div>
                <p className="line-clamp-4 text-sm">{artist.bio}</p>
                <Link href={`/artists/${artist.slug}`}>
                  <Button variant="outline" className="w-full">
                    Ver perfil completo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Buy Tickets */}
          <Button className="w-full" size="lg">
            Comprar entradas
          </Button>
        </div>
      </div>
    </div>
  );
}
