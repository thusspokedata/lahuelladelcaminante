"use server";

import { db } from "@/lib/db";
import { UserRole, UserStatus } from "@/generated/prisma";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

// Verificar que el usuario actual es admin
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

// Actualizar el rol de un usuario
export async function updateUserRoleAction(userId: string, role: UserRole) {
  // Verificar que el usuario que hace la acción es admin
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

// Actualizar el estado de un usuario
export async function updateUserStatusAction(userId: string, status: UserStatus) {
  // Verificar que el usuario que hace la acción es admin
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

// Obtener todos los usuarios
export async function getAllUsersAction() {
  // Verificar que el usuario que hace la acción es admin
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

// Obtener usuarios pendientes
export async function getPendingUsersAction() {
  // Verificar que el usuario que hace la acción es admin
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
