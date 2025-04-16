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
    date: "Viernes 19 de Abril, 2024",
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
    date: "Sábado 20 de Abril, 2024",
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
    date: "Domingo 21 de Abril, 2024",
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

  const handleFilterChange = (filters: {
    date: Date | undefined;
    genre: string | undefined;
    artist: string;
  }) => {
    let filtered = [...mockEvents];

    if (filters.genre) {
      filtered = filtered.filter(event => event.genre === filters.genre);
    }

    if (filters.artist) {
      filtered = filtered.filter(event => 
        event.artist.toLowerCase().includes(filters.artist.toLowerCase())
      );
    }

    if (filters.date) {
      // Aquí podríamos implementar la lógica para filtrar por fecha
      // Por ahora solo mostramos todos los eventos
    }

    setFilteredEvents(filtered);
  };

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
        <EventFilters onFilterChange={handleFilterChange} />

        {/* Lista de Eventos */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No se encontraron eventos con los filtros seleccionados</p>
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <EventCard
                key={event.id}
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