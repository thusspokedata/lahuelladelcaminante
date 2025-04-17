import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

interface ArtistFiltersProps {
  onFilterChange: (filters: { genre: string | undefined; name: string }) => void;
}

export function ArtistFilters({ onFilterChange }: ArtistFiltersProps) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState<string | undefined>(undefined);

  useEffect(() => {
    onFilterChange({ genre, name });
  }, [genre, name, onFilterChange]);

  const handleResetFilters = () => {
    setName("");
    setGenre(undefined);
  };

  return (
    <div className="sticky top-4 space-y-4 rounded-lg border p-4">
      <h2 className="text-xl font-bold">Filtros</h2>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="genre">Género</Label>
          <Select
            value={genre || "all"}
            onValueChange={(value) => setGenre(value === "all" ? undefined : value)}
          >
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
      </div>
    </div>
  );
}
