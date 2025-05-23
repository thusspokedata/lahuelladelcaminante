"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Event } from "@/types";
import { EventCard } from "./EventCard";
import { EventFilters } from "./EventFilters";
import { formatDateWithWeekday } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Music, Info } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

interface EventsClientProps {
  initialEvents: Event[];
}

export function EventsClient({ initialEvents }: EventsClientProps) {
  const t = useTranslations("events");
  const locale = useLocale();

  const [filteredEvents, setFilteredEvents] = useState(initialEvents);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleFilterChange = (filters: {
    date: Date | undefined;
    genre: string | undefined;
    artist: string;
    organizer: string;
  }) => {
    let filtered = [...initialEvents];
    setSelectedDate(filters.date);

    // Only filter by genre if a genre is selected
    if (filters.genre && filters.genre !== "all") {
      filtered = filtered.filter((event) => event.genre === filters.genre);
    }

    if (filters.artist) {
      filtered = filtered.filter((event) =>
        event.artist.name.toLowerCase().includes(filters.artist.toLowerCase())
      );
    }

    if (filters.organizer) {
      filtered = filtered.filter((event) => event.organizer === filters.organizer);
    }

    if (filters.date) {
      filtered = filtered.filter((event) => {
        // Check if any of the event's dates match the selected date
        return event.dates.some((eventDate) => {
          const eventDateObj = new Date(eventDate.date);
          const filterDate = filters.date;
          if (!filterDate) return false;
          return (
            eventDateObj.getDate() === filterDate.getDate() &&
            eventDateObj.getMonth() === filterDate.getMonth() &&
            eventDateObj.getFullYear() === filterDate.getFullYear()
          );
        });
      });
    }

    // Sort events chronologically
    filtered = filtered.map((event) => ({
      ...event,
      dates: [...event.dates].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      }),
    }));

    setFilteredEvents(filtered);
  };

  // If there are no initial events, show a welcome/empty state
  if (initialEvents.length === 0) {
    return (
      <Card className="p-8">
        <CardContent className="flex flex-col items-center justify-center space-y-6 pt-6 text-center">
          <CalendarIcon className="text-primary/70 h-16 w-16" />
          <h3 className="text-2xl font-semibold">{t("noEvents")}</h3>
          <p className="text-muted-foreground max-w-md">{t("client.upcomingMessage")}</p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Button variant="outline" asChild>
              <Link href={`/${locale}/artists`}>
                <Music className="mr-2 h-4 w-4" />
                {t("client.viewArtists")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/about`}>
                <Info className="mr-2 h-4 w-4" />
                {t("client.aboutUs")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create a flat list of events with their dates for chronological sorting
  const sortedEvents = filteredEvents
    .flatMap((event) => {
      // If a date filter is applied, only show the matching date
      if (selectedDate) {
        const matchingDate = event.dates.find((d) => {
          const eventDate = new Date(d.date);
          return (
            eventDate.getDate() === selectedDate.getDate() &&
            eventDate.getMonth() === selectedDate.getMonth() &&
            eventDate.getFullYear() === selectedDate.getFullYear()
          );
        });
        return matchingDate
          ? [
              {
                ...event,
                date: matchingDate.date,
              },
            ]
          : [];
      }
      // Otherwise show all dates
      return event.dates.map((dateInfo) => ({
        ...event,
        date: dateInfo.date,
      }));
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="grid gap-8 md:grid-cols-[300px_1fr]">
      <EventFilters
        onFilterChange={handleFilterChange}
        selectedDate={selectedDate}
        events={initialEvents}
      />

      {/* Events List */}
      <div className="space-y-4">
        {sortedEvents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">{t("client.noEventsFound")}</p>
              <Button
                variant="outline"
                onClick={() =>
                  handleFilterChange({
                    date: undefined,
                    genre: undefined,
                    artist: "",
                    organizer: "",
                  })
                }
              >
                {t("client.clearFilters")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          sortedEvents.map((event, index) => (
            <EventCard
              key={`${event.id}-${index}`}
              id={event.id}
              title={event.title}
              date={formatDateWithWeekday(event.date, locale)}
              artist={event.artist.name}
              organizer={event.organizer}
              genre={event.genre}
              location={event.location}
              time={event.time}
              price={typeof event.price === "string" ? Number(event.price) : event.price}
              images={event.images}
              slug={event.slug}
            />
          ))
        )}
      </div>
    </div>
  );
}
