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
import { useState } from "react";
import { EventCalendar } from "./EventCalendar";

interface EventFiltersProps {
  onFilterChange: (filters: {
    date: Date | undefined;
    genre: string | undefined;
    artist: string;
  }) => void;
  selectedDate: Date | undefined;
  events: {
    dates: {
      date: string;
    }[];
  }[];
}

export function EventFilters({ onFilterChange, selectedDate, events }: EventFiltersProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate);
  const [genre, setGenre] = useState<string>("all");
  const [artist, setArtist] = useState("");

  const handleApplyFilters = () => {
    onFilterChange({
      date,
      genre,
      artist,
    });
  };

  const handleShowAll = () => {
    setDate(undefined);
    setGenre("all");
    setArtist("");
    onFilterChange({
      date: undefined,
      genre: "all",
      artist: "",
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
              <SelectTrigger>
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
