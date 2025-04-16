"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventCard } from "@/components/EventCard";
import { EventFilters } from "@/components/EventFilters";
import Link from "next/link";
import { useState } from "react";

const mockEvents = [
  {
    id: "1",
    title: "Noche de Tango",
    dates: [
      {
        date: "Viernes 19 de Abril, 2025",
        dateObj: new Date(2025, 3, 19, 0, 0, 0)
      },
      {
        date: "Miércoles 23 de Abril, 2025",
        dateObj: new Date(2025, 3, 23, 0, 0, 0)
      }
    ],
    artist: "Tango Argentino Berlin",
    genre: "tango",
    location: "Café Tango",
    time: "20:00",
    price: 15,
    imageUrl: "/placeholder.jpg"
  },
  {
    id: "2",
    title: "Folklore en Berlín",
    dates: [
      {
        date: "Sábado 20 de Abril, 2025",
        dateObj: new Date(2025, 3, 20, 0, 0, 0)
      }
    ],
    artist: "Los Hermanos del Sur",
    genre: "folklore",
    location: "La Peña",
    time: "21:00",
    price: 12,
    imageUrl: "/placeholder.jpg"
  },
  {
    id: "3",
    title: "Rock Argentino",
    dates: [
      {
        date: "Domingo 21 de Abril, 2025",
        dateObj: new Date(2025, 3, 21, 0, 0, 0)
      }
    ],
    artist: "Los Pibes del Rock",
    genre: "rock",
    location: "Rock Bar",
    time: "19:00",
    price: 10,
    imageUrl: "/placeholder.jpg"
  }
];

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
      filtered = filtered.filter(event => event.genre === filters.genre);
    }

    if (filters.artist) {
      filtered = filtered.filter(event => 
        event.artist.toLowerCase().includes(filters.artist.toLowerCase())
      );
    }

    if (filters.date) {
      filtered = filtered.filter(event => {
        // Check if any of the event's dates match the selected date
        return event.dates.some(eventDate => {
          const eventDateObj = eventDate.dateObj;
          const filterDate = filters.date;
          return eventDateObj.getDate() === filterDate.getDate() &&
                 eventDateObj.getMonth() === filterDate.getMonth() &&
                 eventDateObj.getFullYear() === filterDate.getFullYear();
        });
      });
    }

    // Sort events chronologically
    filtered = filtered.map(event => ({
      ...event,
      dates: [...event.dates].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    }));

    setFilteredEvents(filtered);
  };

  // Create a flat list of events with their dates for chronological sorting
  const sortedEvents = filteredEvents.flatMap(event => {
    // If a date filter is applied, only show the matching date
    if (selectedDate) {
      const matchingDate = event.dates.find(d => {
        const eventDate = d.dateObj;
        return eventDate.getDate() === selectedDate.getDate() &&
               eventDate.getMonth() === selectedDate.getMonth() &&
               eventDate.getFullYear() === selectedDate.getFullYear();
      });
      return matchingDate ? [{
        ...event,
        date: matchingDate.date,
        dateObj: matchingDate.dateObj
      }] : [];
    }
    // Otherwise show all dates
    return event.dates.map(dateObj => ({
      ...event,
      date: dateObj.date,
      dateObj: dateObj.dateObj
    }));
  }).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Eventos</h1>
            <p className="text-xl text-muted-foreground">Próximos shows de música argentina en Berlín</p>
          </div>
          <Link href="/">
            <Button variant="outline">Volver al Inicio</Button>
          </Link>
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
                <p className="text-muted-foreground">No se encontraron eventos con los filtros seleccionados</p>
              </CardContent>
            </Card>
          ) : (
            sortedEvents.map((event, index) => (
              <EventCard
                key={`${event.id}-${index}`}
                title={event.title}
                date={event.date}
                artist={event.artist}
                genre={event.genre}
                location={event.location}
                time={event.time}
                price={event.price}
                imageUrl={event.imageUrl}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 