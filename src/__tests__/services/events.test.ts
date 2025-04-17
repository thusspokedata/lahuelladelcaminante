import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllEvents,
  getEventById,
  getEventBySlug,
  getEventsByGenre,
  getEventsByArtistName,
  getEventsByArtistId,
  getEventsByArtistSlug,
  getEventsByDate,
} from "@/services/events";
import { prisma } from "@/lib/db";

// Mock the Prisma client
vi.mock("@/lib/db", () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    artist: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Events Service", () => {
  const testDate = new Date("2023-12-01");

  const mockArtist = {
    id: "artist1",
    name: "Test Artist",
    slug: "test-artist",
    genres: ["Tango"],
    bio: "Bio",
    origin: "Argentina",
  };

  const mockEventDates = [{ id: "date1", date: testDate, eventId: "event1" }];

  const mockImages = [{ id: "img1", url: "test.jpg", alt: "Test image", eventId: "event1" }];

  const mockEvents = [
    {
      id: "event1",
      title: "Test Event",
      slug: "test-event",
      dates: mockEventDates,
      artist: mockArtist,
      artistId: "artist1",
      genre: "Tango",
      location: "Buenos Aires",
      time: "20:00",
      price: 100,
      description: "Test description",
      images: mockImages,
      isActive: true,
    },
    {
      id: "event2",
      title: "Another Event",
      slug: "another-event",
      dates: [{ id: "date2", date: new Date("2023-12-02"), eventId: "event2" }],
      artist: mockArtist,
      artistId: "artist1",
      genre: "Folklore",
      location: "Córdoba",
      time: "21:00",
      price: 150,
      description: "Another description",
      images: [{ id: "img2", url: "another.jpg", alt: "Another image", eventId: "event2" }],
      isActive: true,
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getAllEvents", () => {
    it("should return all active events", async () => {
      // Mock Prisma response
      vi.mocked(prisma.event.findMany).mockResolvedValue(mockEvents);

      // Call service function
      const result = await getAllEvents();

      // Check if Prisma was called correctly
      expect(prisma.event.findMany).toHaveBeenCalledWith({
        include: {
          dates: true,
          artist: true,
          images: true,
        },
        where: {
          isActive: true,
          isDeleted: false,
        },
      });

      // Verify returned data
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("event1");
      expect(result[0].artist.name).toBe("Test Artist");
      expect(result[0].dates[0].date).toEqual(testDate);
    });
  });

  describe("getEventById", () => {
    it("should return event by ID", async () => {
      // Mock Prisma response
      vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvents[0]);

      // Call service function
      const result = await getEventById("event1");

      // Check if Prisma was called correctly
      expect(prisma.event.findUnique).toHaveBeenCalledWith({
        where: {
          id: "event1",
          isActive: true,
          isDeleted: false,
        },
        include: {
          dates: true,
          artist: true,
          images: true,
        },
      });

      // Verify returned data
      expect(result).not.toBeNull();
      expect(result?.id).toBe("event1");
      expect(result?.title).toBe("Test Event");
    });

    it("should return null if event not found", async () => {
      // Mock Prisma response
      vi.mocked(prisma.event.findUnique).mockResolvedValue(null);

      // Call service function
      const result = await getEventById("nonexistent");

      // Verify returned data
      expect(result).toBeNull();
    });
  });

  describe("getEventBySlug", () => {
    it("should return event by slug", async () => {
      // Mock Prisma response
      vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvents[0]);

      // Call service function
      const result = await getEventBySlug("test-event");

      // Check if Prisma was called correctly
      expect(prisma.event.findUnique).toHaveBeenCalledWith({
        where: {
          slug: "test-event",
          isActive: true,
          isDeleted: false,
        },
        include: {
          dates: true,
          artist: true,
          images: true,
        },
      });

      // Verify returned data
      expect(result).not.toBeNull();
      expect(result?.slug).toBe("test-event");
    });
  });

  describe("getEventsByGenre", () => {
    it("should return events filtered by genre", async () => {
      // Mock Prisma response
      vi.mocked(prisma.event.findMany).mockResolvedValue([mockEvents[0]]);

      // Call service function
      const result = await getEventsByGenre("Tango");

      // Check if Prisma was called correctly
      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          genre: "Tango",
          isActive: true,
          isDeleted: false,
        },
        include: {
          dates: true,
          artist: true,
          images: true,
        },
      });

      // Verify returned data
      expect(result).toHaveLength(1);
      expect(result[0].genre).toBe("Tango");
    });
  });

  describe("getEventsByArtistName", () => {
    it("should return events filtered by artist name", async () => {
      // Mock Prisma response
      vi.mocked(prisma.event.findMany).mockResolvedValue(mockEvents);

      // Call service function
      const result = await getEventsByArtistName("Test Artist");

      // Check if Prisma was called correctly
      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          artist: {
            name: {
              contains: "Test Artist",
              mode: "insensitive",
            },
          },
          isActive: true,
          isDeleted: false,
        },
        include: {
          images: true,
          dates: true,
          artist: true,
        },
      });

      // Verify returned data
      expect(result).toHaveLength(2);
      expect(result[0].artist.name).toBe("Test Artist");
    });
  });

  describe("getEventsByArtistId", () => {
    it("should return events filtered by artist ID", async () => {
      // Mock Prisma response
      vi.mocked(prisma.event.findMany).mockResolvedValue(mockEvents);

      // Call service function
      const result = await getEventsByArtistId("artist1");

      // Check if Prisma was called correctly
      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          artistId: "artist1",
          isActive: true,
          isDeleted: false,
        },
        include: {
          dates: true,
          artist: true,
          images: true,
        },
      });

      // Verify returned data
      expect(result).toHaveLength(2);
      expect(result[0].artist.id).toBe("artist1");
    });
  });

  describe("getEventsByArtistSlug", () => {
    it("should return events for an artist slug", async () => {
      // Mock Prisma responses
      vi.mocked(prisma.artist.findUnique).mockResolvedValue({ id: "artist1" });
      vi.mocked(prisma.event.findMany).mockResolvedValue(mockEvents);

      // Call service function
      const result = await getEventsByArtistSlug("test-artist");

      // Check if Prisma calls were made correctly
      expect(prisma.artist.findUnique).toHaveBeenCalledWith({
        where: { slug: "test-artist" },
        select: { id: true },
      });

      expect(prisma.event.findMany).toHaveBeenCalledWith({
        where: {
          artistId: "artist1",
          isActive: true,
          isDeleted: false,
        },
        include: {
          dates: true,
          artist: true,
          images: true,
        },
      });

      // Verify returned data
      expect(result).toHaveLength(2);
    });

    it("should return empty array if artist not found", async () => {
      // Mock Prisma response
      vi.mocked(prisma.artist.findUnique).mockResolvedValue(null);

      // Call service function
      const result = await getEventsByArtistSlug("nonexistent");

      // Verify returned data
      expect(result).toEqual([]);
      expect(prisma.event.findMany).not.toHaveBeenCalled();
    });
  });

  describe("getEventsByDate", () => {
    it("should return events on a specific date", async () => {
      // Mock Prisma response
      vi.mocked(prisma.event.findMany).mockResolvedValue([mockEvents[0]]);

      const queryDate = new Date("2023-12-01");

      // Start and end of the day for date comparison
      const startDate = new Date(queryDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(queryDate);
      endDate.setHours(23, 59, 59, 999);

      // Call service function
      const result = await getEventsByDate(queryDate);

      // Check if Prisma was called correctly with date range
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            dates: {
              some: {
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
            isActive: true,
            isDeleted: false,
          },
        })
      );

      // Verify returned data
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("event1");
    });
  });
});
