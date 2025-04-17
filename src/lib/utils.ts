import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date with weekday included
 * @param date Date object, date string, or ISO date string
 * @returns Formatted date string with weekday in Spanish locale
 */
export function formatDateWithWeekday(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return dateObj.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get start and end of a date range (day, week, month)
 * @param date Base date for the range
 * @param range Type of range to get
 * @returns Object with start and end dates
 */
export function getDateRange(
  date: Date,
  range: "day" | "week" | "month"
): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(date);

  // Reset hours to start of day
  start.setHours(0, 0, 0, 0);

  switch (range) {
    case "day":
      // For day, end is end of same day
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      // Set start to beginning of week (Monday)
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
      start.setDate(diff);

      // Set end to end of week (Sunday)
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case "month":
      // Set start to first day of month
      start.setDate(1);

      // Set end to last day of month
      const year = start.getFullYear();
      const month = start.getMonth();

      // Create a date for the first day of the next month, then go back one day
      end.setFullYear(year, month + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

/**
 * Check if a date is in the past
 * @param date Date to check
 * @returns boolean indicating if date is in the past
 */
export function isDateInPast(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  // Reset hours to compare just the dates
  dateObj.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return dateObj < now;
}

/**
 * Format a time string (e.g., "19:30") to a localized format (e.g., "7:30 PM")
 * @param timeString Time string in 24h format (HH:MM)
 * @param locale Locale for formatting
 * @returns Formatted time string
 */
export function formatTime(timeString: string, locale: string = "es-ES"): string {
  // Handle special cases
  if (timeString === "24:00") {
    // "24:00" is not a valid time, but we'll preserve it as is
    return timeString;
  }

  if (!/^\d{1,2}:\d{2}$/.test(timeString)) {
    return timeString;
  }

  const [hours, minutes] = timeString.split(":").map(Number);

  // Validate the hours and minutes
  if (hours > 23 || minutes > 59) {
    return timeString; // Return the original for invalid times
  }

  // Create a date object with the time
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: locale === "en-US", // Use 12h format for English, 24h for others
  });
}
