"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallback, useEffect, useState } from "react";

interface ArtistFiltersProps {
  onFilterChange: (filters: { genre: string | undefined; name: string }) => void;
}

export function ArtistFilters({ onFilterChange }: ArtistFiltersProps) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState<string | undefined>(undefined);

  // Using useCallback to prevent recreating the filter function on each render
  const applyFilters = useCallback(() => {
    onFilterChange({ genre, name });
  }, [genre, name, onFilterChange]);

  // Effect will only run when genre or name changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleResetFilters = () => {
    setName("");
    setGenre(undefined);
  };

  // Handle genre change separately to avoid Select component issues
  const handleGenreChange = (value: string) => {
    setGenre(value === "all" ? undefined : value);
  };

  return (
    <div className="sticky top-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="genre">Género</Label>
            <Select value={genre || "all"} onValueChange={handleGenreChange}>
              <SelectTrigger id="genre">
                <SelectValue placeholder="Todos los géneros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los géneros</SelectItem>
                <SelectItem value="tango">Tango</SelectItem>
                <SelectItem value="folklore">Folklore</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="cumbia">Cumbia</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Buscar por nombre..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <Button className="w-full" variant="outline" onClick={handleResetFilters}>
            Limpiar filtros
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
