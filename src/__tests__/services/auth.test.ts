import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCurrentUser,
  hasRole,
  isActiveUser,
  isPendingUser,
  isBlockedUser,
  canPerformAction,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getPendingUsers,
} from "@/services/auth";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { UserRole, UserStatus } from "@/generated/prisma";

// Mock dependencies
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Auth Service", () => {
  // Sample user data
  const mockActiveUser = {
    id: "user1",
    clerkId: "clerk_user1",
    email: "user1@example.com",
    name: "Test User",
    role: "USER" as UserRole,
    status: "ACTIVE" as UserStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPendingUser = {
    ...mockActiveUser,
    id: "user2",
    clerkId: "clerk_user2",
    status: "PENDING" as UserStatus,
  };

  const mockAdminUser = {
    ...mockActiveUser,
    id: "admin1",
    clerkId: "clerk_admin1",
    role: "ADMIN" as UserRole,
  };

  const mockBlockedUser = {
    ...mockActiveUser,
    id: "user3",
    clerkId: "clerk_user3",
    status: "BLOCKED" as UserStatus,
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getCurrentUser", () => {
    it("should return user when authenticated", async () => {
      // Mock Clerk auth
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({
        userId: "clerk_user1",
      });

      // Mock Prisma response
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockActiveUser);

      // Call the function
      const result = await getCurrentUser();

      // Verify Prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: "clerk_user1" },
      });

      // Verify result
      expect(result).toEqual(mockActiveUser);
    });

    it("should return null when not authenticated", async () => {
      // Mock Clerk auth with no userId
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({
        userId: null,
      });

      // Call the function
      const result = await getCurrentUser();

      // Verify Prisma was not called
      expect(prisma.user.findUnique).not.toHaveBeenCalled();

      // Verify result
      expect(result).toBeNull();
    });

    it("should return null when user not found in database", async () => {
      // Mock Clerk auth
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({
        userId: "nonexistent_user",
      });

      // Mock Prisma response
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Call the function
      const result = await getCurrentUser();

      // Verify Prisma was called correctly
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: "nonexistent_user" },
      });

      // Verify result
      expect(result).toBeNull();
    });
  });

  describe("hasRole", () => {
    it("should return true when user has the specified role", async () => {
      // Setup getCurrentUser mock to return admin user
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({ userId: "clerk_admin1" });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser);

      // Call the function
      const result = await hasRole("ADMIN");

      // Verify result
      expect(result).toBe(true);
    });

    it("should return false when user does not have the role", async () => {
      // Setup getCurrentUser mock to return normal user
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({ userId: "clerk_user1" });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockActiveUser);

      // Call the function
      const result = await hasRole("ADMIN");

      // Verify result
      expect(result).toBe(false);
    });

    it("should return false when user is not authenticated", async () => {
      // Setup getCurrentUser mock to return null
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({ userId: null });

      // Call the function
      const result = await hasRole("USER");

      // Verify result
      expect(result).toBe(false);
    });
  });

  describe("user status checks", () => {
    it("isActiveUser should return true for active users", async () => {
      // Setup getCurrentUser mock
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({ userId: "clerk_user1" });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockActiveUser);

      // Call the function
      const result = await isActiveUser();

      // Verify result
      expect(result).toBe(true);
    });

    it("isPendingUser should return true for pending users", async () => {
      // Setup getCurrentUser mock
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({ userId: "clerk_user2" });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockPendingUser);

      // Call the function
      const result = await isPendingUser();

      // Verify result
      expect(result).toBe(true);
    });

    it("isBlockedUser should return true for blocked users", async () => {
      // Setup getCurrentUser mock
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({ userId: "clerk_user3" });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockBlockedUser);

      // Call the function
      const result = await isBlockedUser();

      // Verify result
      expect(result).toBe(true);
    });
  });

  describe("canPerformAction", () => {
    it("should return true when user is active and has required role", async () => {
      // Setup getCurrentUser mock
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({ userId: "clerk_admin1" });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser);

      // Call the function
      const result = await canPerformAction(["ADMIN", "ARTIST"]);

      // Verify result
      expect(result).toBe(true);
    });

    it("should return false when user is active but does not have required role", async () => {
      // Setup getCurrentUser mock
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({ userId: "clerk_user1" });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockActiveUser);

      // Call the function
      const result = await canPerformAction(["ADMIN"]);

      // Verify result
      expect(result).toBe(false);
    });

    it("should return false when user is not active", async () => {
      // Setup getCurrentUser mock
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({ userId: "clerk_user2" });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockPendingUser);

      // Call the function
      const result = await canPerformAction(["USER"]);

      // Verify result
      expect(result).toBe(false);
    });

    it("should return false when user is not authenticated", async () => {
      // Setup getCurrentUser mock
      // @ts-expect-error - simplifying the auth mock for testing
      vi.mocked(auth).mockResolvedValue({ userId: null });

      // Call the function
      const result = await canPerformAction(["USER"]);

      // Verify result
      expect(result).toBe(false);
    });
  });

  describe("getAllUsers", () => {
    it("should return all users", async () => {
      // Mock users array
      const mockUsers = [mockActiveUser, mockPendingUser, mockAdminUser];

      // Mock Prisma response
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers);

      // Call the function
      const result = await getAllUsers();

      // Verify Prisma was called correctly
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: "desc",
        },
      });

      // Verify result
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(3);
    });

    it("should return empty array when there is an error", async () => {
      // Mock Prisma to throw an error
      vi.mocked(prisma.user.findMany).mockRejectedValue(new Error("Database error"));

      // Call the function
      const result = await getAllUsers();

      // Verify result
      expect(result).toEqual([]);
    });
  });

  describe("updateUserStatus", () => {
    it("should update user status", async () => {
      // Mock Prisma response
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockPendingUser,
        status: "ACTIVE" as UserStatus,
      });

      // Call the function
      const result = await updateUserStatus("user2", "ACTIVE");

      // Verify Prisma was called correctly
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user2" },
        data: { status: "ACTIVE" },
      });

      // Verify result
      expect(result.status).toBe("ACTIVE");
    });

    it("should throw error when update fails", async () => {
      // Mock Prisma to throw an error
      vi.mocked(prisma.user.update).mockRejectedValue(new Error("Update failed"));

      // Call the function and expect it to throw
      await expect(updateUserStatus("user2", "ACTIVE")).rejects.toThrow();
    });
  });

  describe("updateUserRole", () => {
    it("should update user role", async () => {
      // Mock Prisma response
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockActiveUser,
        role: "ARTIST" as UserRole,
      });

      // Call the function
      const result = await updateUserRole("user1", "ARTIST");

      // Verify Prisma was called correctly
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: { role: "ARTIST" },
      });

      // Verify result
      expect(result.role).toBe("ARTIST");
    });

    it("should throw error when update fails", async () => {
      // Mock Prisma to throw an error
      vi.mocked(prisma.user.update).mockRejectedValue(new Error("Update failed"));

      // Call the function and expect it to throw
      await expect(updateUserRole("user1", "ADMIN")).rejects.toThrow();
    });
  });

  describe("getPendingUsers", () => {
    it("should return only pending users", async () => {
      // Mock Prisma response
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockPendingUser]);

      // Call the function
      const result = await getPendingUsers();

      // Verify Prisma was called correctly
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { status: "PENDING" },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Verify result
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("PENDING");
    });

    it("should return empty array when there is an error", async () => {
      // Mock Prisma to throw an error
      vi.mocked(prisma.user.findMany).mockRejectedValue(new Error("Database error"));

      // Call the function
      const result = await getPendingUsers();

      // Verify result
      expect(result).toEqual([]);
    });
  });
});
