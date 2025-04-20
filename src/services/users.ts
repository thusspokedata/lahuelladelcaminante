import { prisma } from "@/lib/db";
import { UserRole, UserStatus } from "@/generated/prisma";

/**
 * User interface with all fields from the User model
 */
export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all users from the database
 */
export async function getAllUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
  return users;
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  return user;
}

/**
 * Get a user by Clerk ID
 */
export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
  });
  return user;
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user;
}

/**
 * Create a new user
 */
export async function createUser(data: {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
}): Promise<User> {
  const user = await prisma.user.create({
    data: {
      clerkId: data.clerkId,
      email: data.email,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      role: data.role || UserRole.USER,
      status: data.status || UserStatus.PENDING,
    },
  });
  return user;
}

/**
 * Update a user
 */
export async function updateUser(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: UserRole;
    status?: UserStatus;
  }
): Promise<User> {
  const user = await prisma.user.update({
    where: { id },
    data,
  });
  return user;
}

/**
 * Associate a user with an artist profile
 */
export async function associateUserWithArtist(userId: string, artistId: string): Promise<void> {
  await prisma.artist.update({
    where: { id: artistId },
    data: { userId },
  });
}

/**
 * Get users by status
 */
export async function getUsersByStatus(status: UserStatus): Promise<User[]> {
  const users = await prisma.user.findMany({
    where: { status },
    orderBy: {
      createdAt: "desc",
    },
  });
  return users;
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: UserRole): Promise<User[]> {
  const users = await prisma.user.findMany({
    where: { role },
    orderBy: {
      createdAt: "desc",
    },
  });
  return users;
}

/**
 * Get pending artist requests (users with ARTIST role but PENDING status)
 */
export async function getPendingArtistRequests(): Promise<User[]> {
  const users = await prisma.user.findMany({
    where: {
      role: UserRole.ARTIST,
      status: UserStatus.PENDING,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return users;
}

/**
 * Get a user with their artist profile
 */
export async function getUserWithArtistProfile(userId: string): Promise<
  | (User & {
      artistProfile: {
        id: string;
        name: string;
        slug: string;
        genres: string[];
        bio: string;
        origin: string;
      } | null;
    })
  | null
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      artistProfiles: {
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

  if (!user) return null;

  // Map the first artist profile to artistProfile field
  return {
    ...user,
    artistProfile: user.artistProfiles.length > 0 ? user.artistProfiles[0] : null,
  };
}
