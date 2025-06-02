"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeEventsCarousel } from "@/components/HomeEventsCarousel";
import { useTranslations } from "use-intl";
import { Event } from "@/services/events";
import { Artist } from "@/services/artists";
import Image from "next/image";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { useLocalizedDate } from "@/hooks/useLocalizedDate";
import { getProfileImage } from "@/lib/utils";

// Card component for featured artists on the home page
function FeaturedArtistCard({ artist, locale }: { artist: Artist; locale: string }) {
  const t = useTranslations("artists");
  const profileImage = getProfileImage(artist.images, artist.profileImageId);
  
  return (
    <Card className="flex h-full flex-col overflow-hidden pt-0 pb-4">
      <div className="relative aspect-square w-full overflow-hidden">
        {profileImage ? (
          <Image
            src={profileImage.url}
            alt={profileImage.alt || artist.name}
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <ImagePlaceholder className="h-full" />
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{artist.name}</CardTitle>
        <CardDescription>{artist.genres.join(", ")}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-2">{artist.bio}</p>
        </div>
        <div className="mt-4">
          <Link href={`/${locale}/artists/${artist.slug}`}>
            <Button size="sm" variant="outline" className="w-full">{t("viewProfile")}</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Card component for the home page events
function HomeEventCard({ event, locale }: { event: Event; locale: string }) {
  const t = useTranslations("events.card");
  const { formatShort } = useLocalizedDate();
  
  // Format the first date in the array
  const formattedDate = event.dates && event.dates.length > 0 
    ? formatShort(event.dates[0].date.toString()) 
    : "";

  return (
    <Card className="flex h-full flex-col overflow-hidden pt-0">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {event.images && event.images.length > 0 ? (
          <Image
            src={event.images[0].url}
            alt={event.images[0].alt || event.title}
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">{event.title}</CardTitle>
        <CardDescription>{formattedDate}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1">
          <p className="mb-1 text-sm font-semibold">{event.artist.name}</p>
          <p className="text-sm text-muted-foreground">{event.location}</p>
        </div>
        <div className="mt-4">
          <Link href={`/${locale}/events/${event.slug}`}>
            <Button size="sm" variant="outline" className="w-full">{t("viewDetails")}</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function HomeClient({ events, artists, locale }: { events: Event[]; artists: Artist[]; locale: string }) {
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  
  // Take the first 4 events for the featured section
  const featuredEvents = events.slice(0, 4);
  
  // Get artists with upcoming events, up to 4
  const artistsWithEvents = artists
    .filter(artist => artist.upcomingEvents && artist.upcomingEvents.length > 0)
    .sort((a, b) => (b.upcomingEvents?.length || 0) - (a.upcomingEvents?.length || 0))
    .slice(0, 4);
  
  return (
    <>
      <div className="container mx-auto px-4">
        {/* Events carousel */}
        <section className="mb-12">
          <HomeEventsCarousel events={events} />
        </section>
      </div>

      {/* Upcoming Events Section */}
      <section className="relative mb-12 w-full overflow-hidden py-16">
        {/* Background with gradient and pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-blue-50 to-slate-100 dark:from-purple-950/30 dark:via-blue-900/20 dark:to-slate-900/30">
          <div className="absolute inset-0 opacity-5 dark:opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        </div>
        <div className="relative container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{tHome("upcomingEvents")}</h2>
            <p className="text-muted-foreground">{tHome("upcomingEventsDesc")}</p>
          </div>
          <Link href={`/${locale}/events`}>
            <Button variant="outline">{tCommon("viewAll")}</Button>
          </Link>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredEvents.map((event) => (
            <HomeEventCard key={event.id} event={event} locale={locale} />
          ))}
        </div>
      </div>
      </section>

      {/* Featured Artists Section */}
      <section className="relative mb-12 w-full overflow-hidden py-16">
        {/* Background with gradient and pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 dark:from-amber-950/30 dark:via-orange-900/20 dark:to-yellow-900/30">
          <div className="absolute inset-0 opacity-5 dark:opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        </div>
        <div className="relative container mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{tHome("featuredArtists")}</h2>
              <p className="text-muted-foreground">{tHome("featuredArtistsDesc")}</p>
            </div>
            <Link href={`/${locale}/artists`}>
              <Button variant="outline">{tCommon("viewAll")}</Button>
            </Link>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {artistsWithEvents.length > 0 ? (
              artistsWithEvents.map((artist) => (
                <FeaturedArtistCard key={artist.id} artist={artist} locale={locale} />
              ))
            ) : (
              <Card className="sm:col-span-2 lg:col-span-4">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground py-8">{tHome("noFeaturedArtists")}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
