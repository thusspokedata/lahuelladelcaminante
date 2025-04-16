import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventCard } from "@/components/EventCard";
import { EventFilters } from "@/components/EventFilters";
import Link from "next/link";

const mockEvents = [
  {
    id: "1",
    title: "Noche de Tango",
    date: "Viernes 19 de Abril, 2024",
    artist: "Tango Argentino Berlin",
    genre: "Tango",
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
    genre: "Folklore",
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
    genre: "Rock",
    location: "Rock Bar",
    time: "19:00",
    price: 10,
    imageUrl: "/placeholder.jpg"
  }
];

export default function EventsPage() {
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
        <EventFilters />

        {/* Lista de Eventos */}
        <div className="space-y-4">
          {mockEvents.map((event) => (
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
          ))}
        </div>
      </div>
    </div>
  );
} 