"use server";

import { db } from "@/lib/db";
import { UserRole, UserStatus } from "@/generated/prisma";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

// Verify that the current user is admin
async function verifyAdmin() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return user;
}

// Update a user's role
export async function updateUserRoleAction(userId: string, role: UserRole) {
  // Verify that the user performing the action is admin
  await verifyAdmin();

  try {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error al actualizar el rol:", error);
    return { success: false, error: "No se pudo actualizar el rol del usuario" };
  }
}

// Update a user's status
export async function updateUserStatusAction(userId: string, status: UserStatus) {
  // Verify that the user performing the action is admin
  await verifyAdmin();

  try {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { status },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error al actualizar el estado:", error);
    return { success: false, error: "No se pudo actualizar el estado del usuario" };
  }
}

// Get all users
export async function getAllUsersAction() {
  // Verify that the user performing the action is admin
  await verifyAdmin();

  try {
    const users = await db.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, users };
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return { success: false, error: "No se pudieron obtener los usuarios" };
  }
}

// Get pending users
export async function getPendingUsersAction() {
  // Verify that the user performing the action is admin
  await verifyAdmin();

  try {
    const users = await db.user.findMany({
      where: { status: "PENDING" },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, users };
  } catch (error) {
    console.error("Error al obtener usuarios pendientes:", error);
    return { success: false, error: "No se pudieron obtener los usuarios pendientes" };
  }
}
