"use client";

import { Calendar } from "@/components/ui/calendar";
import { Suspense, useState } from "react";

interface EventCalendarProps {
  onSelect?: (date: Date | undefined) => void;
}

function CalendarComponent({ onSelect }: EventCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    onSelect?.(selectedDate);
  };

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={handleSelect}
      className="rounded-md border"
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