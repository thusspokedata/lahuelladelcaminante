"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
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

  // Autoplay plugin configuration - slower transition for fullscreen view
  const autoplayPlugin = Autoplay({ delay: 8000, stopOnInteraction: true });

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
    <div className="relative right-[50%] left-[50%] -mx-[50vw] w-screen">
      <Carousel
        setApi={setApi}
        className="w-full"
        plugins={[autoplayPlugin]}
        opts={{
          align: "center",
          loop: true,
        }}
      >
        <CarouselContent className="h-[450px] sm:h-[550px] md:h-[650px] lg:h-[750px] xl:h-[85vh]">
          {upcomingEvents.map((event, index) => (
            <CarouselItem key={`${event.id}-${index}`} className="basis-full pl-0">
              <Link href={`/events/${event.slug}`} className="block h-full">
                <div className="relative h-full w-full overflow-hidden">
                  {/* Image as background */}
                  {event.images && event.images.length > 0 ? (
                    <Image
                      src={event.images[0].url}
                      alt={event.images[0].alt || event.title}
                      fill
                      className="object-cover brightness-[0.75]"
                      sizes="100vw"
                      priority
                    />
                  ) : (
                    <div className="h-full w-full bg-black"></div>
                  )}

                  {/* Content overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end">
                    <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent px-8 pt-40 pb-16 md:px-14 md:pb-24">
                      <div className="mx-0 max-w-7xl md:mx-40">
                        <h3 className="mb-3 text-3xl leading-tight font-bold text-white md:text-4xl lg:text-5xl xl:text-6xl">
                          {event.title}
                        </h3>
                        <p className="mb-5 text-xl text-white/90 md:text-2xl lg:text-3xl">
                          {event.artist.name}
                        </p>
                        <div className="mb-5 flex flex-col gap-4 text-white/90 sm:flex-row sm:items-center sm:gap-8">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 lg:h-6 lg:w-6" />
                            <span className="text-base md:text-lg lg:text-xl">
                              {formatDateWithWeekday(event.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 lg:h-6 lg:w-6" />
                            <span className="text-base md:text-lg lg:text-xl">{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 lg:h-6 lg:w-6" />
                            <span className="text-base md:text-lg lg:text-xl">
                              {event.location}
                            </span>
                          </div>
                        </div>
                        <div className="mt-6">
                          <Button
                            variant="outline"
                            className="group h-auto border-white bg-transparent px-6 py-4 hover:text-blue-300 text-base font-medium text-white hover:border-white hover:bg-transparent md:text-lg"
                          >
                            Ver evento
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 md:h-5 md:w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Custom navigation arrows - positioned at sides */}
        <CarouselPrevious className="absolute border-0 top-1/2 left-4 z-10 h-12 w-12 -translate-y-1/2 bg-transparent text-white hover:bg-transparent hover:text-white/80 md:h-16 md:w-16" />
        <CarouselNext className="absolute border-0 top-1/2 right-4 z-10 h-12 w-12 -translate-y-1/2 bg-transparent text-white hover:bg-transparent hover:text-white/80 md:h-16 md:w-16" />
        
        {/* Indicators - now moved inside the carousel */}
        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-3">
          {count > 0 &&
            Array.from({ length: count }).map((_, i) => (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                className={`h-2 w-2 rounded-full p-0 ${
                  i === current - 1 ? "bg-primary" : "bg-white/50"
                }`}
                onClick={() => api?.scrollTo(i)}
              />
            ))}
        </div>
      </Carousel>
    </div>
  );
}
