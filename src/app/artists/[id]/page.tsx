import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { getArtistById } from "@/services/artists";
import { findEventsByArtist } from "@/services";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Music } from "lucide-react";

// In Next.js 15, params should be awaited properly
interface ArtistPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  // Await params to access its properties
  const resolvedParams = await params;
  const id = resolvedParams.id;

  console.log("Looking for artist with ID:", id);

  // Fetch artist from database
  const artist = await getArtistById(id);

  // If artist not found, show 404
  if (!artist) {
    notFound();
  }

  // Get upcoming events for this artist
  const artistEvents = await findEventsByArtist(artist.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/artists" className="text-primary hover:underline">
          ← Volver a artistas
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_400px]">
        {/* Main content */}
        <div>
          <div className="mb-8 flex items-center gap-6">
            <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-full">
              {artist.images && artist.images.length > 0 ? (
                <Image
                  src={artist.images[0].url}
                  alt={artist.images[0].alt}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
              ) : (
                <ImagePlaceholder className="h-full w-full" />
              )}
            </div>
            <div>
              <h1 className="mb-2 text-4xl font-bold">{artist.name}</h1>
              <div className="mb-3 flex flex-wrap gap-2">
                {artist.genres.map((genre) => (
                  <Badge key={genre} variant="outline">
                    {genre}
                  </Badge>
                ))}
              </div>
              <div className="text-muted-foreground flex items-center">
                <MapPin size={18} className="mr-1" />
                <span>{artist.origin}</span>
              </div>
            </div>
          </div>

          <h2 className="mb-4 text-2xl font-semibold">Biografía</h2>
          <div className="mb-8 text-lg whitespace-pre-line">{artist.bio}</div>

          {artistEvents.length > 0 && (
            <>
              <h2 className="mb-4 text-2xl font-semibold">Próximos Eventos</h2>
              <div className="space-y-4">
                {artistEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <Card className="hover:bg-secondary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-medium">{event.title}</h3>
                            <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center">
                                  <Calendar size={16} className="mr-1" />
                                  <span>Fechas:</span>
                                </div>
                                <ul className="ml-6 list-disc text-xs">
                                  {event.dates.map((date, idx) => (
                                    <li key={idx}>{date.date}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="flex items-center">
                                <Music size={16} className="mr-1" />
                                <span>{event.genre}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin size={16} className="mr-1" />
                                <span>{event.location}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-lg font-medium">
                            {event.price ? `${event.price}€` : "Gratis"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {artist.socialMedia && Object.values(artist.socialMedia).some(Boolean) && (
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Enlaces</h2>
                <div className="flex flex-col space-y-3">
                  {artist.socialMedia.instagram && (
                    <a
                      href={artist.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-500 hover:underline"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                      Instagram
                    </a>
                  )}
                  {artist.socialMedia.spotify && (
                    <a
                      href={artist.socialMedia.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-green-500 hover:underline"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                      Spotify
                    </a>
                  )}
                  {artist.socialMedia.youtube && (
                    <a
                      href={artist.socialMedia.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-red-500 hover:underline"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                      </svg>
                      YouTube
                    </a>
                  )}
                  {artist.socialMedia.website && (
                    <a
                      href={artist.socialMedia.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-500 hover:underline"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"
                        />
                      </svg>
                      Sitio Web
                    </a>
                  )}
                  {artist.socialMedia.tiktok && (
                    <a
                      href={artist.socialMedia.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-black hover:underline"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                      </svg>
                      TikTok
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {artist.images && artist.images.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Galería</h2>
                <div className="grid grid-cols-2 gap-2">
                  {artist.images.map((image, index) => (
                    <div key={index} className="relative aspect-square overflow-hidden rounded-md">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        className="object-cover"
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
