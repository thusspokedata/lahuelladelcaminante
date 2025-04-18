import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllUsers,
  getUserById,
  getUserByClerkId,
  getUserByEmail,
  createUser,
  updateUser,
  associateUserWithArtist,
  getUsersByStatus,
  getUsersByRole,
  getPendingArtistRequests,
  getUserWithArtistProfile,
  User,
} from "@/services/users";
import { prisma } from "@/lib/db";
import { UserRole, UserStatus } from "@/generated/prisma";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    artist: {
      update: vi.fn(),
    },
  },
}));

describe("Users Service", () => {
  // Sample user data
  const mockUser: User = {
    id: "user1",
    clerkId: "clerk_user1",
    email: "user1@example.com",
    firstName: "Test",
    lastName: "User",
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockArtistUser: User = {
    ...mockUser,
    id: "artist1",
    clerkId: "clerk_artist1",
    role: UserRole.ARTIST,
  };

  const mockPendingUser: User = {
    ...mockUser,
    id: "pending1",
    clerkId: "clerk_pending1",
    status: UserStatus.PENDING,
  };

  const mockUserWithArtistProfile = {
    ...mockArtistUser,
    artistProfile: {
      id: "profile1",
      name: "Artist Name",
      slug: "artist-name",
      genres: ["Tango"],
      bio: "Artist bio",
      origin: "Buenos Aires",
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getAllUsers", () => {
    it("should return all users", async () => {
      // Mock Prisma response
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser, mockArtistUser]);

      // Call the function
      const result = await getAllUsers();

      // Verify Prisma was called correctly
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: "desc",
        },
      });

      // Verify result
      expect(result).toEqual([mockUser, mockArtistUser]);
      expect(result).toHaveLength(2);
    });
  });

  describe("getUserById", () => {
    it("should return user when found by id", async () => {
      // Mock Prisma response
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Call the function
      const result = await getUserById("user1");

      // Verify Prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user1" },
      });

      // Verify result
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found by id", async () => {
      // Mock Prisma response
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Call the function
      const result = await getUserById("nonexistent");

      // Verify result
      expect(result).toBeNull();
    });
  });

  describe("getUserByClerkId", () => {
    it("should return user when found by clerk id", async () => {
      // Mock Prisma response
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Call the function
      const result = await getUserByClerkId("clerk_user1");

      // Verify Prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: "clerk_user1" },
      });

      // Verify result
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found by clerk id", async () => {
      // Mock Prisma response
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Call the function
      const result = await getUserByClerkId("nonexistent");

      // Verify result
      expect(result).toBeNull();
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when found by email", async () => {
      // Mock Prisma response
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      // Call the function
      const result = await getUserByEmail("user1@example.com");

      // Verify Prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "user1@example.com" },
      });

      // Verify result
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found by email", async () => {
      // Mock Prisma response
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Call the function
      const result = await getUserByEmail("nonexistent@example.com");

      // Verify result
      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    it("should create a new user with default role and status", async () => {
      // Mock user data to create
      const newUserData = {
        clerkId: "new_clerk_id",
        email: "new@example.com",
      };

      // Expected created user
      const createdUser = {
        id: "new1",
        clerkId: "new_clerk_id",
        email: "new@example.com",
        firstName: null,
        lastName: null,
        role: UserRole.USER,
        status: UserStatus.PENDING,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      // Mock Prisma response
      vi.mocked(prisma.user.create).mockResolvedValue(createdUser);

      // Call the function
      const result = await createUser(newUserData);

      // Verify Prisma was called correctly
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: "new_clerk_id",
          email: "new@example.com",
          firstName: null,
          lastName: null,
          role: UserRole.USER,
          status: UserStatus.PENDING,
        },
      });

      // Verify result
      expect(result).toEqual(createdUser);
    });

    it("should create a user with custom role and status", async () => {
      // Mock user data to create
      const newUserData = {
        clerkId: "artist_clerk_id",
        email: "artist@example.com",
        firstName: "New",
        lastName: "Artist",
        role: UserRole.ARTIST,
        status: UserStatus.ACTIVE,
      };

      // Expected created user
      const createdUser = {
        id: "new2",
        ...newUserData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      // Mock Prisma response
      vi.mocked(prisma.user.create).mockResolvedValue(createdUser);

      // Call the function
      const result = await createUser(newUserData);

      // Verify Prisma was called correctly
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: newUserData,
      });

      // Verify result
      expect(result).toEqual(createdUser);
    });
  });

  describe("updateUser", () => {
    it("should update user fields", async () => {
      // Mock user data to update
      const updateData = {
        firstName: "Updated",
        lastName: "Name",
        role: UserRole.ADMIN,
      };

      // Expected updated user
      const updatedUser = {
        ...mockUser,
        firstName: "Updated",
        lastName: "Name",
        role: UserRole.ADMIN,
        updatedAt: expect.any(Date),
      };

      // Mock Prisma response
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

      // Call the function
      const result = await updateUser("user1", updateData);

      // Verify Prisma was called correctly
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: updateData,
      });

      // Verify result
      expect(result).toEqual(updatedUser);
    });
  });

  describe("associateUserWithArtist", () => {
    it("should associate user with artist profile", async () => {
      // Mock Prisma response
      vi.mocked(prisma.artist.update).mockResolvedValue({
        id: "artist1",
        name: "Artist Name",
        slug: "artist-name",
        genres: ["Tango"],
        bio: "Artist bio",
        origin: "Buenos Aires",
        socialMedia: null,
        userId: "user1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Call the function
      await associateUserWithArtist("user1", "artist1");

      // Verify Prisma was called correctly
      expect(prisma.artist.update).toHaveBeenCalledWith({
        where: { id: "artist1" },
        data: { userId: "user1" },
      });
    });
  });

  describe("getUsersByStatus", () => {
    it("should return users filtered by status", async () => {
      // Mock users with specific status
      const pendingUsers = [mockPendingUser];

      // Mock Prisma response
      vi.mocked(prisma.user.findMany).mockResolvedValue(pendingUsers);

      // Call the function
      const result = await getUsersByStatus(UserStatus.PENDING);

      // Verify Prisma was called correctly
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { status: UserStatus.PENDING },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Verify result
      expect(result).toEqual(pendingUsers);
      expect(result[0].status).toBe(UserStatus.PENDING);
    });
  });

  describe("getUsersByRole", () => {
    it("should return users filtered by role", async () => {
      // Mock users with specific role
      const artistUsers = [mockArtistUser];

      // Mock Prisma response
      vi.mocked(prisma.user.findMany).mockResolvedValue(artistUsers);

      // Call the function
      const result = await getUsersByRole(UserRole.ARTIST);

      // Verify Prisma was called correctly
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: UserRole.ARTIST },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Verify result
      expect(result).toEqual(artistUsers);
      expect(result[0].role).toBe(UserRole.ARTIST);
    });
  });

  describe("getPendingArtistRequests", () => {
    it("should return pending artist requests", async () => {
      // Mock pending artist users
      const pendingArtists = [
        {
          ...mockArtistUser,
          status: UserStatus.PENDING,
        },
      ];

      // Mock Prisma response
      vi.mocked(prisma.user.findMany).mockResolvedValue(pendingArtists);

      // Call the function
      const result = await getPendingArtistRequests();

      // Verify Prisma was called correctly
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: UserRole.ARTIST,
          status: UserStatus.PENDING,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Verify result
      expect(result).toEqual(pendingArtists);
      expect(result[0].role).toBe(UserRole.ARTIST);
      expect(result[0].status).toBe(UserStatus.PENDING);
    });
  });

  describe("getUserWithArtistProfile", () => {
    it("should return user with artist profile", async () => {
      // Mock Prisma response
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithArtistProfile);

      // Call the function
      const result = await getUserWithArtistProfile("artist1");

      // Verify Prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "artist1" },
        include: {
          artistProfile: {
            select: {
              id: true,
              name: true,
              slug: true,
              genres: true,
              bio: true,
              origin: true,
            },
          },
        },
      });

      // Verify result
      expect(result).toEqual(mockUserWithArtistProfile);
      expect(result?.artistProfile?.name).toBe("Artist Name");
    });

    it("should return null when user not found", async () => {
      // Mock Prisma response
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Call the function
      const result = await getUserWithArtistProfile("nonexistent");

      // Verify result
      expect(result).toBeNull();
    });
  });
});
