"use client";

import { Calendar } from "@/components/ui/calendar";
import { Suspense, useState } from "react";
import { DayContent, DayContentProps } from "react-day-picker";

// Defining this interface for potential future use or documentation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Event {
  id: string;
  title: string;
  date: Date;
  description: string;
  location: string;
  image: string;
}

interface EventCalendarProps {
  onSelect?: (date: Date | undefined) => void;
  selectedDate?: Date | undefined;
  events?: {
    dates: {
      date: string;
    }[];
  }[];
}

function CalendarComponent({ onSelect, selectedDate, events }: EventCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    onSelect?.(selectedDate);
  };

  // Get all unique dates that have events
  const eventDates = events?.flatMap((event) => event.dates.map((d) => new Date(d.date))) || [];

  // Function to check if a date has events
  const hasEvents = (date: Date) => {
    return eventDates.some(
      (eventDate) =>
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
    );
  };

  const DayContentWithDot = (props: DayContentProps) => {
    const hasEvent = hasEvents(props.date);
    return (
      <div className="relative">
        <DayContent {...props} />
        {hasEvent && (
          <div className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-green-500" />
        )}
      </div>
    );
  };

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={handleSelect}
      className="rounded-md border"
      components={{
        DayContent: DayContentWithDot,
      }}
    />
  );
}

export function EventCalendar(props: EventCalendarProps) {
  return (
    <Suspense
      fallback={<div className="bg-muted h-[240px] w-full animate-pulse rounded-md border" />}
    >
      <CalendarComponent {...props} />
    </Suspense>
  );
}
