"use client";

import { Calendar } from "@/components/ui/calendar";
import { Suspense, useState } from "react";
import { DayContent } from "react-day-picker";

interface EventCalendarProps {
  onSelect?: (date: Date | undefined) => void;
  selectedDate?: Date | undefined;
  events?: {
    dates: {
      dateObj: Date;
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
  const eventDates = events?.flatMap(event => 
    event.dates.map(d => d.dateObj)
  ) || [];

  // Function to check if a date has events
  const hasEvents = (date: Date) => {
    return eventDates.some(eventDate => 
      eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear()
    );
  };

  const DayContentWithDot = (props: any) => {
    const hasEvent = hasEvents(props.date);
    return (
      <div className="relative">
        <DayContent {...props} />
        {hasEvent && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500" />
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
    <Suspense fallback={
      <div className="h-[240px] w-full rounded-md border bg-muted animate-pulse" />
    }>
      <CalendarComponent {...props} />
    </Suspense>
  );
} 