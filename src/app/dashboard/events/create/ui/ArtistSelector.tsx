"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { getArtistsByUser } from "../actions";

// Define a simplified Artist type for form use
type FormArtist = {
  id: string;
  name: string;
  bio?: string;
};

interface ArtistSelectorProps {
  value: FormArtist[];
  onChange: (artists: FormArtist[]) => void;
}

export function ArtistSelector({ value, onChange }: ArtistSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [artistBio, setArtistBio] = useState("");
  const [existingArtists, setExistingArtists] = useState<FormArtist[]>([]);
  const [selectedExistingArtist, setSelectedExistingArtist] = useState<string>("new");
  const [isLoading, setIsLoading] = useState(false);

  // Load existing artists when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      loadExistingArtists();
    }
  }, [isDialogOpen]);

  const loadExistingArtists = async () => {
    try {
      setIsLoading(true);
      const artists = await getArtistsByUser();
      setExistingArtists(artists);
    } catch (error) {
      console.error("Error loading artists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addArtist = () => {
    // If an existing artist is selected
    if (selectedExistingArtist !== "new") {
      const existingArtist = existingArtists.find((artist) => artist.id === selectedExistingArtist);
      if (existingArtist && !value.some((a) => a.id === existingArtist.id)) {
        onChange([...value, existingArtist]);
      }
    }
    // If creating a new artist
    else if (artistName.trim()) {
      // Create a new artist with a temporary ID
      const newArtist: FormArtist = {
        id: `temp-${Date.now()}`, // Will be replaced with actual ID from database later
        name: artistName.trim(),
        bio: artistBio.trim() || undefined,
      };

      // Add to the list
      onChange([...value, newArtist]);
    }

    // Reset form
    setArtistName("");
    setArtistBio("");
    setSelectedExistingArtist("new");
    setIsDialogOpen(false);
  };

  const removeArtist = (artistId: string) => {
    onChange(value.filter((artist) => artist.id !== artistId));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setSelectedExistingArtist(selectedValue);

    // If an existing artist is selected, prefill the fields
    if (selectedValue !== "new") {
      const selectedArtist = existingArtists.find((artist) => artist.id === selectedValue);
      if (selectedArtist) {
        setArtistName(selectedArtist.name);
        setArtistBio(selectedArtist.bio || "");
      }
    } else {
      // Clear fields if "Create new artist" is selected
      setArtistName("");
      setArtistBio("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Artistas</Label>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" type="button">
              Agregar Artista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Artista</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {isLoading ? (
                <div className="text-center">Cargando artistas...</div>
              ) : (
                <>
                  {existingArtists.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="artistSelect">Seleccionar Artista</Label>
                      <select
                        id="artistSelect"
                        className="border-input bg-background w-full rounded-md border px-3 py-2"
                        value={selectedExistingArtist}
                        onChange={handleSelectChange}
                      >
                        <option value="new">Crear nuevo artista</option>
                        {existingArtists.map((artist) => (
                          <option key={artist.id} value={artist.id}>
                            {artist.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="artistName">Nombre del Artista</Label>
                    <Input
                      id="artistName"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="Nombre del artista"
                      disabled={selectedExistingArtist !== "new" && existingArtists.length > 0}
                    />
                  </div>

                  {selectedExistingArtist === "new" && (
                    <div className="space-y-2">
                      <Label htmlFor="artistBio">Biografía (opcional)</Label>
                      <Textarea
                        id="artistBio"
                        value={artistBio}
                        onChange={(e) => setArtistBio(e.target.value)}
                        placeholder="Breve biografía del artista"
                        rows={4}
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={addArtist}
                      disabled={selectedExistingArtist === "new" && !artistName.trim()}
                    >
                      Agregar
                    </Button>
                  </div>

                  {selectedExistingArtist === "new" && (
                    <p className="text-muted-foreground text-sm">
                      El artista se asociará automáticamente a tu cuenta. Podrás completar más
                      información después desde el panel de artistas.
                    </p>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Display selected artists */}
      {value.length > 0 ? (
        <div className="mt-2 space-y-2">
          {value.map((artist) => (
            <div
              key={artist.id}
              className="flex items-center justify-between rounded-md border p-2"
            >
              <div>
                <p className="font-medium">{artist.name}</p>
                {artist.bio && <p className="text-muted-foreground text-sm">{artist.bio}</p>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeArtist(artist.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No hay artistas seleccionados</p>
      )}
    </div>
  );
}
