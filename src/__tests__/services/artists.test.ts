import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllArtists,
  getArtistById,
  getArtistBySlug,
  getArtistsByGenre,
  searchArtistsByName,
} from "@/services/artists";
import { prisma } from "@/lib/db";

// Mock the Prisma client
vi.mock("@/lib/db", () => ({
  prisma: {
    artist: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("Artists Service", () => {
  const mockArtists = [
    {
      id: "1",
      name: "Test Artist",
      slug: "test-artist",
      genres: ["Tango", "Folklore"],
      bio: "Test bio",
      origin: "Argentina",
      profileImageId: "profile-image-1",
      images: [{ id: "1", url: "test.jpg", alt: "Test image", artistId: "1" }],
      events: [{ id: "event1" }],
      socialMedia: { instagram: "testartist" },
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user1",
    },
    {
      id: "2",
      name: "Another Artist",
      slug: "another-artist",
      genres: ["Rock"],
      bio: "Another bio",
      origin: "Buenos Aires",
      profileImageId: null,
      images: [{ id: "2", url: "another.jpg", alt: "Another image", artistId: "2" }],
      events: [],
      socialMedia: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user2",
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getAllArtists", () => {
    it("should return all artists", async () => {
      // Mock the Prisma response
      vi.mocked(prisma.artist.findMany).mockResolvedValue(mockArtists);

      // Call the service function
      const result = await getAllArtists();

      // Check if Prisma was called correctly
      expect(prisma.artist.findMany).toHaveBeenCalledWith({
        include: {
          images: true,
          events: true,
        },
      });

      // Verify the returned data
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("1");
      expect(result[0].name).toBe("Test Artist");
      expect(result[0].images[0].url).toBe("test.jpg");
      expect(result[0].upcomingEvents).toEqual(["event1"]);
    });
  });

  describe("getArtistById", () => {
    it("should return artist by id", async () => {
      // Mock the Prisma response
      vi.mocked(prisma.artist.findUnique).mockResolvedValue(mockArtists[0]);

      // Call the service function
      const result = await getArtistById("1");

      // Check if Prisma was called correctly
      expect(prisma.artist.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        include: {
          images: true,
          events: true,
        },
      });

      // Verify the returned data
      expect(result).not.toBeNull();
      expect(result?.id).toBe("1");
      expect(result?.name).toBe("Test Artist");
    });

    it("should return null if artist not found", async () => {
      // Mock the Prisma response
      vi.mocked(prisma.artist.findUnique).mockResolvedValue(null);

      // Call the service function
      const result = await getArtistById("nonexistent");

      // Check if Prisma was called correctly
      expect(prisma.artist.findUnique).toHaveBeenCalledWith({
        where: { id: "nonexistent" },
        include: {
          images: true,
          events: true,
        },
      });

      // Verify the returned data
      expect(result).toBeNull();
    });
  });

  describe("getArtistBySlug", () => {
    it("should return artist by slug", async () => {
      // Mock the Prisma response
      vi.mocked(prisma.artist.findUnique).mockResolvedValue(mockArtists[0]);

      // Call the service function
      const result = await getArtistBySlug("test-artist");

      // Check if Prisma was called correctly
      expect(prisma.artist.findUnique).toHaveBeenCalledWith({
        where: { slug: "test-artist" },
        include: {
          images: true,
          events: true,
        },
      });

      // Verify the returned data
      expect(result).not.toBeNull();
      expect(result?.slug).toBe("test-artist");
    });
  });

  describe("getArtistsByGenre", () => {
    it("should return artists by genre", async () => {
      // Mock the Prisma response
      vi.mocked(prisma.artist.findMany).mockResolvedValue([mockArtists[0]]);

      // Call the service function
      const result = await getArtistsByGenre("Tango");

      // Check if Prisma was called correctly
      expect(prisma.artist.findMany).toHaveBeenCalledWith({
        where: {
          genres: {
            has: "Tango",
          },
        },
        include: {
          images: true,
          events: true,
        },
      });

      // Verify the returned data
      expect(result).toHaveLength(1);
      expect(result[0].genres).toContain("Tango");
    });
  });

  describe("searchArtistsByName", () => {
    it("should return artists matching name search", async () => {
      // Mock the Prisma response
      vi.mocked(prisma.artist.findMany).mockResolvedValue([mockArtists[0]]);

      // Call the service function
      const result = await searchArtistsByName("Test");

      // Check if Prisma was called correctly
      expect(prisma.artist.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: "Test",
            mode: "insensitive",
          },
        },
        include: {
          images: true,
          events: true,
        },
      });

      // Verify the returned data
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test Artist");
    });
  });
});
