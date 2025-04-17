import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cn, formatDateWithWeekday, getDateRange, isDateInPast, formatTime } from "./utils";

describe("Utils", () => {
  describe("cn function", () => {
    it("should merge classnames", () => {
      const result = cn("class1", "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      const condition = true;
      const result = cn("base", condition ? "active" : "");
      expect(result).toBe("base active");
    });

    it("should handle falsy values", () => {
      const result = cn("base", undefined, null, false && "not-included");
      expect(result).toBe("base");
    });
  });

  describe("formatDateWithWeekday function", () => {
    // Mock original Date.prototype.toLocaleDateString to return consistent values for testing
    const originalToLocaleDateString = Date.prototype.toLocaleDateString;
    beforeEach(() => {
      Date.prototype.toLocaleDateString = function () {
        return `formatted-${this.toISOString().split("T")[0]}`;
      };
    });

    afterEach(() => {
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
    });

    it("should format a Date object correctly", () => {
      const testDate = new Date("2023-05-15T12:00:00Z");
      const result = formatDateWithWeekday(testDate);
      expect(result).toBe("formatted-2023-05-15");
    });

    it("should format a date string correctly", () => {
      const result = formatDateWithWeekday("2023-05-15T12:00:00Z");
      expect(result).toBe("formatted-2023-05-15");
    });
  });

  describe("getDateRange function", () => {
    // Mock date to avoid timezone issues
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-05-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // Helper function to format date in a timezone-independent way
    const formatDateString = (date: Date) => {
      return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
      );
    };

    it("should return correct day range", () => {
      const testDate = new Date("2023-05-15T12:30:45Z"); // A Monday
      const { start, end } = getDateRange(testDate, "day");

      // Check year, month, and day components instead of comparing ISO strings
      expect(formatDateString(start)).toBe("2023-05-15");
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);

      expect(formatDateString(end)).toBe("2023-05-15");
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });

    it("should return correct week range starting from Monday", () => {
      const testDate = new Date("2023-05-15T12:30:45Z"); // A Monday
      const { start, end } = getDateRange(testDate, "week");

      expect(formatDateString(start)).toBe("2023-05-15");
      expect(formatDateString(end)).toBe("2023-05-21");
    });

    it("should return correct week range when starting from mid-week", () => {
      // Wednesday
      const wednesdayDate = new Date("2023-05-17T12:30:45Z");
      const { start, end } = getDateRange(wednesdayDate, "week");

      expect(formatDateString(start)).toBe("2023-05-15");
      expect(formatDateString(end)).toBe("2023-05-21");
    });

    it("should return correct week range when starting from Sunday", () => {
      // Sunday
      const sundayDate = new Date("2023-05-21T12:30:45Z");
      const { start, end } = getDateRange(sundayDate, "week");

      expect(formatDateString(start)).toBe("2023-05-15");
      expect(formatDateString(end)).toBe("2023-05-21");
    });

    it("should return correct month range", () => {
      const testDate = new Date("2023-05-15T12:30:45Z");
      const { start, end } = getDateRange(testDate, "month");

      expect(formatDateString(start)).toBe("2023-05-01");
      expect(formatDateString(end)).toBe("2023-05-31");
    });

    it("should handle month boundaries correctly", () => {
      // For this test, let's use a direct test of the function rather than
      // depending on system time or mocks that might be affected by timezone issues

      // Manually create a fixed date
      const mayLastDay = new Date(2023, 4, 31); // May 31, 2023 (months are 0-indexed)

      // Call the function
      const { start, end } = getDateRange(mayLastDay, "month");

      // Check specific year, month, day values directly
      expect(start.getFullYear()).toBe(2023);
      expect(start.getMonth()).toBe(4); // May (0-indexed)
      expect(start.getDate()).toBe(1);

      expect(end.getFullYear()).toBe(2023);
      expect(end.getMonth()).toBe(4); // May (0-indexed)
      expect(end.getDate()).toBe(31);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });
  });

  describe("isDateInPast function", () => {
    let originalNow: typeof Date.now;

    beforeEach(() => {
      originalNow = Date.now;
      // Mock current date to 2023-06-15
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
      Date.now = originalNow;
    });

    it("should return true for past dates", () => {
      expect(isDateInPast(new Date("2023-06-14"))).toBe(true);
      expect(isDateInPast("2023-01-01")).toBe(true);
      expect(isDateInPast("2022-12-31")).toBe(true);
    });

    it("should return false for today's date", () => {
      expect(isDateInPast(new Date("2023-06-15"))).toBe(false);
      expect(isDateInPast("2023-06-15")).toBe(false);
    });

    it("should return false for future dates", () => {
      expect(isDateInPast(new Date("2023-06-16"))).toBe(false);
      expect(isDateInPast("2023-07-01")).toBe(false);
      expect(isDateInPast("2024-01-01")).toBe(false);
    });
  });

  describe("formatTime function", () => {
    let originalLocaleTimeString: typeof Date.prototype.toLocaleTimeString;

    beforeEach(() => {
      originalLocaleTimeString = Date.prototype.toLocaleTimeString;

      // Type-safe mock implementation
      Date.prototype.toLocaleTimeString = function (
        this: Date,
        locales?: string | string[] | undefined,
        options?: Intl.DateTimeFormatOptions | undefined
      ): string {
        const hours = this.getHours();
        const minutes = this.getMinutes().toString().padStart(2, "0");

        if (options?.hour12) {
          // 12-hour format for en-US
          const period = hours >= 12 ? "PM" : "AM";
          const hour12 = hours % 12 || 12;
          return `${hour12}:${minutes} ${period}`;
        } else {
          // 24-hour format for other locales
          return `${hours}:${minutes}`;
        }
      };
    });

    afterEach(() => {
      Date.prototype.toLocaleTimeString = originalLocaleTimeString;
    });

    it("should format time in 24-hour format for default locale", () => {
      expect(formatTime("14:30")).toBe("14:30");
      expect(formatTime("8:15")).toBe("8:15");
      expect(formatTime("23:45")).toBe("23:45");
    });

    it("should format time in 12-hour format for en-US locale", () => {
      expect(formatTime("14:30", "en-US")).toBe("2:30 PM");
      expect(formatTime("8:15", "en-US")).toBe("8:15 AM");
      expect(formatTime("23:45", "en-US")).toBe("11:45 PM");
      expect(formatTime("00:00", "en-US")).toBe("12:00 AM");
      expect(formatTime("12:00", "en-US")).toBe("12:00 PM");
    });

    it("should handle special time formats and invalid values", () => {
      expect(formatTime("invalid")).toBe("invalid");
      expect(formatTime("24:00")).toBe("24:00");
      expect(formatTime("25:00")).toBe("25:00");
      expect(formatTime("12:60")).toBe("12:60");
      expect(formatTime("")).toBe("");
    });
  });
});
