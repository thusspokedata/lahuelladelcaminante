import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { UserRole, UserStatus } from "@/generated/prisma";

export type AuthUser = {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Gets the current user from Clerk and retrieves their complete information from the database
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Get the authenticated user ID from Clerk
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return null;
    }

    // Find the user in our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      console.error(`User with clerkId ${userId} not found in database`);
      return null;
    }

    return user as AuthUser;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Checks if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Checks if the user is active
 */
export async function isActiveUser(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.status === "ACTIVE";
}

/**
 * Checks if the user is pending approval
 */
export async function isPendingUser(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.status === "PENDING";
}

/**
 * Checks if the user is blocked
 */
export async function isBlockedUser(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.status === "BLOCKED";
}

/**
 * Checks if the current user can perform a specific action
 * based on their role and status
 */
export async function canPerformAction(requiredRoles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Check if the user is active
  if (user.status !== "ACTIVE") {
    return false;
  }

  // Check if the user has one of the required roles
  return requiredRoles.includes(user.role);
}

/**
 * Gets all users (useful for admin panel)
 */
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
}

/**
 * Updates a user's status
 */
export async function updateUserStatus(userId: string, status: UserStatus) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    return user;
  } catch (error) {
    console.error(`Error updating status for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Updates a user's role
 */
export async function updateUserRole(userId: string, role: UserRole) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return user;
  } catch (error) {
    console.error(`Error updating role for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Gets users pending approval
 */
export async function getPendingUsers() {
  try {
    const users = await prisma.user.findMany({
      where: { status: "PENDING" },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  } catch (error) {
    console.error("Error getting pending users:", error);
    return [];
  }
}
