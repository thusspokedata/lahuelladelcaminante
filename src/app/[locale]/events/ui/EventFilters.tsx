"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { EventCalendar } from "./EventCalendar";

interface EventFiltersProps {
  onFilterChange: (filters: {
    date: Date | undefined;
    genre: string | undefined;
    artist: string;
    organizer: string;
  }) => void;
  selectedDate: Date | undefined;
  events: {
    dates: {
      date: string | Date;
    }[];
    organizer?: string;
  }[];
}

export function EventFilters({ onFilterChange, selectedDate, events }: EventFiltersProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate);
  const [genre, setGenre] = useState<string>("all");
  const [artist, setArtist] = useState("");
  const [organizer, setOrganizer] = useState("all");
  const [uniqueOrganizers, setUniqueOrganizers] = useState<string[]>([]);

  // Extract unique organizers from events
  useEffect(() => {
    const organizers = new Set<string>();
    events.forEach((event) => {
      if (event.organizer) {
        organizers.add(event.organizer);
      }
    });
    setUniqueOrganizers(Array.from(organizers).sort());
  }, [events]);

  const handleApplyFilters = () => {
    onFilterChange({
      date,
      genre,
      artist,
      organizer: organizer === "all" ? "" : organizer,
    });
  };

  const handleShowAll = () => {
    setDate(undefined);
    setGenre("all");
    setArtist("");
    setOrganizer("all");
    onFilterChange({
      date: undefined,
      genre: "all",
      artist: "",
      organizer: "",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha</label>
            <EventCalendar onSelect={setDate} selectedDate={date} events={events} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Género</label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger data-testid="genre-select">
                <SelectValue placeholder="Seleccionar género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los géneros</SelectItem>
                <SelectItem value="tango">Tango</SelectItem>
                <SelectItem value="folklore">Folklore</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
                <SelectItem value="electronica">Electrónica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Artista</label>
            <Input
              placeholder="Buscar artista..."
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Organizador</label>
            <Select value={organizer} onValueChange={setOrganizer}>
              <SelectTrigger data-testid="organizer-select">
                <SelectValue placeholder="Seleccionar organizador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los organizadores</SelectItem>
                {uniqueOrganizers.map((org) => (
                  <SelectItem key={org} value={org}>
                    {org}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleApplyFilters}>
              Aplicar Filtros
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleShowAll}>
              Mostrar Todos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
