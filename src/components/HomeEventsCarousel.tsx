"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, MusicIcon } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { formatDateWithWeekday } from "@/lib/utils";
import { Event } from "@/types";
import Autoplay from "embla-carousel-autoplay";

interface HomeEventsCarouselProps {
  events: Event[];
}

export function HomeEventsCarousel({ events }: HomeEventsCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Autoplay plugin configuration - slower transition for single event view
  const autoplayPlugin = Autoplay({ delay: 7000, stopOnInteraction: true });

  // Effect must be called before any conditional returns
  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // If no events, return null
  if (!events || events.length === 0) {
    return null;
  }

  // Prepare events to display (only future dates and sorted)
  const upcomingEvents = events
    .flatMap((event) => {
      return event.dates.map((dateInfo) => ({
        ...event,
        date: dateInfo.date,
      }));
    })
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6); // Maximum 6 events to display

  // If no upcoming events, return null
  if (upcomingEvents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Próximos Eventos</h2>
        <Link href="/events">
          <Button variant="outline" size="sm">
            Ver todos
          </Button>
        </Link>
      </div>

      <Carousel
        setApi={setApi}
        className="w-full"
        plugins={[autoplayPlugin]}
        opts={{
          align: "center",
          loop: true,
        }}
      >
        <CarouselContent>
          {upcomingEvents.map((event, index) => (
            <CarouselItem key={`${event.id}-${index}`} className="basis-full">
              <Link href={`/events/${event.slug}`}>
                <div className="bg-card text-card-foreground overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md md:flex">
                  <div className="relative aspect-video w-full md:h-auto md:w-1/2">
                    {event.images && event.images.length > 0 ? (
                      <Image
                        src={event.images[0].url}
                        alt={event.images[0].alt || event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="bg-muted flex h-full w-full items-center justify-center">
                        <MusicIcon className="text-muted-foreground h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white md:hidden">
                      <h3 className="text-lg leading-tight font-bold">{event.title}</h3>
                      <p className="text-sm">{event.artist.name}</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-6 md:w-1/2">
                    <div className="mb-4 hidden md:block">
                      <h3 className="mb-1 text-2xl font-bold">{event.title}</h3>
                      <p className="text-muted-foreground text-lg">{event.artist.name}</p>
                    </div>
                    <div className="flex items-start space-x-2 text-sm md:text-base">
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 md:h-5 md:w-5" />
                      <span>{formatDateWithWeekday(event.date)}</span>
                    </div>
                    <div className="mt-2 flex items-start space-x-2 text-sm md:text-base">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 md:h-5 md:w-5" />
                      <span>{event.time}</span>
                    </div>
                    <div className="mt-2 flex items-start space-x-2 text-sm md:text-base">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 md:h-5 md:w-5" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4 md:-left-6" />
        <CarouselNext className="-right-4 md:-right-6" />
      </Carousel>

      <div className="flex justify-center gap-2 pt-2">
        {count > 0 &&
          Array.from({ length: count }).map((_, i) => (
            <Button
              key={i}
              variant="ghost"
              size="icon"
              className={`h-2 w-2 rounded-full p-0 ${
                i === current - 1 ? "bg-primary" : "bg-muted"
              }`}
              onClick={() => api?.scrollTo(i)}
            />
          ))}
      </div>
    </div>
  );
}
