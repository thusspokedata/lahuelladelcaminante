import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es, de, enUS } from "date-fns/locale";
import { SupportedLocale } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date with weekday included
 * @param date Date object, date string, or ISO date string
 * @param locale Locale for date formatting (defaults to 'es')
 * @returns Formatted date string with weekday in the specified locale
 */
export function formatDateWithWeekday(date: Date | string, locale: string = "es"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return dateObj.toLocaleDateString(
    locale === "en" ? "en-US" : locale === "de" ? "de-DE" : "es-ES",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
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
 * Get a date without time component (hours, minutes, seconds set to 0)
 * @param date Optional date to normalize (defaults to current date)
 * @returns A new Date object with time component set to 00:00:00.000
 */
export function getDateWithoutTime(date = new Date()): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Check if a date is in the past
 * @param date Date to check
 * @returns boolean indicating if date is in the past
 */
export function isDateInPast(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = getDateWithoutTime(); // Usar la nueva función en lugar de repetir código
  
  return getDateWithoutTime(dateObj) < now;
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

/**
 * Convert a string to a URL-friendly slug
 * @param text The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD") // Split accented characters into base character and accent
    .replace(/[\u0300-\u036f]/g, "") // Remove accented characters
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove non-word characters except -
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing -
}

/**
 * Checks if an image is the profile image based on the profileImageId
 */
export function isProfileImage(
  img: { url: string; alt: string; public_id?: string },
  profileImageId: string | null | undefined
): boolean {
  if (!profileImageId || !img.public_id) return false;

  // Exact match
  if (img.public_id === profileImageId) return true;

  // Check when profileImageId is the complete public_id
  if (profileImageId.includes(img.public_id)) return true;

  // Check when profileImageId is part of the public_id
  if (img.public_id.includes(profileImageId)) return true;

  // Check for the last part of public_id after the last slash
  const shortPublicId = img.public_id.split("/").pop();
  const shortProfileId = profileImageId.split("/").pop();

  if (shortPublicId && shortProfileId && shortPublicId === shortProfileId) {
    return true;
  }

  return false;
}

/**
 * Gets the profile image from an array of images based on profileImageId
 * Falls back to the first image if no match is found
 */
export function getProfileImage(
  images: Array<{ url: string; alt: string; public_id?: string }> | undefined | null,
  profileImageId: string | null | undefined
) {
  if (!images || images.length === 0) return null;

  const matchedImage = profileImageId
    ? images.find((img) => isProfileImage(img, profileImageId))
    : null;

  return matchedImage || images[0];
}

// Format date with locale support for application's supported languages
export function formatDateByLocale(dateString: string, locale: SupportedLocale = "es") {
  const date = new Date(dateString);

  // Get date-fns locale based on current language
  const dateLocale =
    {
      es,
      de,
      en: enUS,
    }[locale] || es;

  const weekdayFormat = "EEEE"; // Same for all languages
  const dateFormat =
    locale === "es" ? "d 'de' MMMM, yyyy" : locale === "de" ? "d. MMMM yyyy" : "MMMM d, yyyy";

  const weekday = format(date, weekdayFormat, { locale: dateLocale });
  const formattedDate = format(date, dateFormat, { locale: dateLocale });

  // Capitalize first letter of weekday
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return `${capitalizedWeekday}, ${formattedDate}`;
}

// Simplified version without weekday for compact displays
export function formatDateShortByLocale(dateString: string, locale: SupportedLocale = "es") {
  const date = new Date(dateString);

  const dateLocale =
    {
      es,
      de,
      en: enUS,
    }[locale] || es;

  const dateFormat =
    locale === "es" ? "d 'de' MMMM, yyyy" : locale === "de" ? "d. MMMM yyyy" : "MMMM d, yyyy";

  return format(date, dateFormat, { locale: dateLocale });
}
