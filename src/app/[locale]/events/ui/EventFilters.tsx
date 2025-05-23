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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("events.filters");

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
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("date")}</label>
            <EventCalendar onSelect={setDate} selectedDate={date} events={events} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("genre")}</label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger data-testid="genre-select">
                <SelectValue placeholder={t("selectGenre")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allGenres")}</SelectItem>
                <SelectItem value="tango">{t("genreOptions.tango")}</SelectItem>
                <SelectItem value="folklore">{t("genreOptions.folklore")}</SelectItem>
                <SelectItem value="rock">{t("genreOptions.rock")}</SelectItem>
                <SelectItem value="jazz">{t("genreOptions.jazz")}</SelectItem>
                <SelectItem value="electronica">{t("genreOptions.electronica")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("artist")}</label>
            <Input
              placeholder={t("searchArtist")}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("organizer")}</label>
            <Select value={organizer} onValueChange={setOrganizer}>
              <SelectTrigger data-testid="organizer-select">
                <SelectValue placeholder={t("selectOrganizer")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allOrganizers")}</SelectItem>
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
              {t("applyFilters")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleShowAll}>
              {t("showAll")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
