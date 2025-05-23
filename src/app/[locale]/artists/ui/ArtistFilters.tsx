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
import { useTranslations } from "next-intl";

interface ArtistFiltersProps {
  onFilterChange: (filters: { genre: string | undefined; name: string }) => void;
}

export function ArtistFilters({ onFilterChange }: ArtistFiltersProps) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState<string | undefined>(undefined);
  const t = useTranslations("artists.filters");

  // Genre options with translations
  const genreOptions = [
    { value: "tango", label: t("genreOptions.tango") },
    { value: "folklore", label: t("genreOptions.folklore") },
    { value: "rock", label: t("genreOptions.rock") },
    { value: "cumbia", label: t("genreOptions.cumbia") },
    { value: "jazz", label: t("genreOptions.jazz") },
  ];

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
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="genre">{t("genre")}</Label>
            <Select value={genre || "all"} onValueChange={handleGenreChange}>
              <SelectTrigger id="genre">
                <SelectValue placeholder={t("allGenres")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allGenres")}</SelectItem>
                {genreOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              placeholder={t("searchByName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <Button className="w-full" variant="outline" onClick={handleResetFilters}>
            {t("clearFilters")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
