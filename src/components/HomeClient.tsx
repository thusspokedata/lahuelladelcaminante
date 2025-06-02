"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeEventsCarousel } from "@/components/HomeEventsCarousel";
import { useTranslations } from "use-intl";
import { Event } from "@/services/events";
import Image from "next/image";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { format } from "date-fns";

// Card component for the home page events
function HomeEventCard({ event, locale }: { event: Event; locale: string }) {
  const t = useTranslations("events.card");
  
  // Format the first date in the array
  const formattedDate = event.dates && event.dates.length > 0 
    ? format(new Date(event.dates[0].date), "PPP") 
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

export function HomeClient({ events, locale }: { events: Event[]; locale: string }) {
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  
  // Take the first 4 events for the featured section
  const featuredEvents = events.slice(0, 4);
  
  return (
    <>
      <div className="container mx-auto px-4">
        {/* Events carousel */}
        <section className="mb-12">
          <HomeEventsCarousel events={events} />
        </section>
      </div>

      {/* Upcoming Events Section */}
      <section className="mb-12 w-full bg-slate-100 py-12 dark:bg-slate-800">
        <div className="container mx-auto px-4">
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

      <div className="container mx-auto px-4">
        {/* Artists Section */}
        <section className="mb-12">
          <Card className="flex min-h-[200px] flex-col">
            <CardHeader>
              <CardTitle>{tHome("artists")}</CardTitle>
              <CardDescription>{tHome("artistsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Link href={`/${locale}/artists`}>
                <Button className="w-full">{tCommon("explore")}</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
