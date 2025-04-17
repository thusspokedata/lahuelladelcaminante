"use client";

import { Card, CardContent } from "@/components/ui/card";
import { EventCard } from "@/components/EventCard";
import { EventFilters } from "@/components/EventFilters";
import { useState } from "react";
import { mockEvents } from "@/mockData";

export default function EventsPage() {
  const [filteredEvents, setFilteredEvents] = useState(mockEvents);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleFilterChange = (filters: {
    date: Date | undefined;
    genre: string | undefined;
    artist: string;
  }) => {
    let filtered = [...mockEvents];
    setSelectedDate(filters.date);

    // Only filter by genre if a genre is selected
    if (filters.genre && filters.genre !== "all") {
      filtered = filtered.filter((event) => event.genre === filters.genre);
    }

    if (filters.artist) {
      filtered = filtered.filter((event) =>
        event.artist.toLowerCase().includes(filters.artist.toLowerCase())
      );
    }

    if (filters.date) {
      filtered = filtered.filter((event) => {
        // Check if any of the event's dates match the selected date
        return event.dates.some((eventDate) => {
          const eventDateObj = eventDate.dateObj;
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
      dates: [...event.dates].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()),
    }));

    setFilteredEvents(filtered);
  };

  // Create a flat list of events with their dates for chronological sorting
  const sortedEvents = filteredEvents
    .flatMap((event) => {
      // If a date filter is applied, only show the matching date
      if (selectedDate) {
        const matchingDate = event.dates.find((d) => {
          const eventDate = d.dateObj;
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
                dateObj: matchingDate.dateObj,
              },
            ]
          : [];
      }
      // Otherwise show all dates
      return event.dates.map((dateObj) => ({
        ...event,
        date: dateObj.date,
        dateObj: dateObj.dateObj,
      }));
    })
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div>
          <h1 className="mb-2 text-4xl font-bold">Eventos</h1>
          <p className="text-muted-foreground text-xl">
            Próximos shows de música argentina en Berlín
          </p>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        <EventFilters
          onFilterChange={handleFilterChange}
          selectedDate={selectedDate}
          events={mockEvents}
        />

        {/* Lista de Eventos */}
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
                date={event.date}
                artist={event.artist}
                genre={event.genre}
                location={event.location}
                time={event.time}
                price={event.price}
                images={event.images}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
