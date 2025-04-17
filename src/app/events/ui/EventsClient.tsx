"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Event } from "@/types";
import { EventCard } from "./EventCard";
import { EventFilters } from "./EventFilters";
import { formatDateWithWeekday } from "@/lib/utils";

interface EventsClientProps {
  initialEvents: Event[];
}

export function EventsClient({ initialEvents }: EventsClientProps) {
  const [filteredEvents, setFilteredEvents] = useState(initialEvents);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleFilterChange = (filters: {
    date: Date | undefined;
    genre: string | undefined;
    artist: string;
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
              <p className="text-muted-foreground">
                No se encontraron eventos con los filtros seleccionados
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedEvents.map((event, index) => (
            <EventCard
              key={`${event.id}-${index}`}
              id={event.id}
              title={event.title}
              date={formatDateWithWeekday(event.date)}
              artist={event.artist.name}
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
