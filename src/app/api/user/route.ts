import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth";
import { auth } from "@clerk/nextjs/server";

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const authResult = await auth();
    const userId = authResult.userId;
    console.log("API: Auth check - userId:", userId);

    if (!userId) {
      console.log("API: No userId found in auth");
      return NextResponse.json(
        {
          error: "No autorizado",
          message: "No userId found in authentication",
        },
        { status: 401 }
      );
    }

    // Get user data
    console.log("API: Fetching user data for userId:", userId);
    const user = await getCurrentUser();

    if (!user) {
      console.log("API: User not found in database for userId:", userId);
      return NextResponse.json(
        {
          error: "Usuario no encontrado",
          message: "User exists in Clerk but not in database",
        },
        { status: 404 }
      );
    }

    console.log("API: User found:", {
      id: user.id,
      status: user.status,
      role: user.role,
    });

    // Return relevant data (omit sensitive information)
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      isAuthenticated: true,
      canCreateEvents: user.status === "ACTIVE",
    });
  } catch (error) {
    console.error("API Error getting user:", error);
    return NextResponse.json(
      {
        error: "Error al obtener datos del usuario",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
