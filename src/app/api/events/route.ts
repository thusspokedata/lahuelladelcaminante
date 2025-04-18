import { NextRequest, NextResponse } from "next/server";
import { createEvent, CreateEventInput } from "@/services/events";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/services/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await auth();
    const userId = authResult.userId;
    console.log("API Events: Auth check - userId:", userId);

    if (!userId) {
      console.log("API Events: No userId found in auth");

      // Check if there are cookies in the request
      const hasCookies = request.headers.get("cookie") ? true : false;
      console.log("API Events: Request has cookies:", hasCookies);

      return NextResponse.json(
        {
          error: "No autorizado. Debes iniciar sesión para crear eventos.",
          cookies: hasCookies,
        },
        { status: 401 }
      );
    }

    // Get current user from our database
    console.log("API Events: Fetching user data for userId:", userId);
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      console.log("API Events: User not found in database for userId:", userId);
      return NextResponse.json(
        {
          error: "Usuario no encontrado en la base de datos.",
          clerk_user_id: userId,
        },
        { status: 404 }
      );
    }

    // Verify that the user is active
    if (currentUser.status !== "ACTIVE") {
      console.log(`API Events: User ${userId} has status ${currentUser.status}, not ACTIVE`);
      return NextResponse.json(
        {
          error:
            "Tu cuenta debe estar activa para crear eventos. Estado actual: " + currentUser.status,
        },
        { status: 403 }
      );
    }

    // Get event data from request body
    const data = await request.json();

    // Prepare data for event creation
    const eventData: CreateEventInput = {
      title: data.title,
      artistId: data.artistId,
      dates: data.dates.map((dateStr: string) => new Date(dateStr)),
      location: data.location,
      time: data.time,
      price: data.price ? parseFloat(data.price) : undefined,
      description: data.description,
      genre: data.genre,
      organizerName:
        data.organizerName || `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim(),
      createdById: currentUser.id,
    };

    // Create the event
    console.log("API Events: Creating event for user:", currentUser.id);
    const newEvent = await createEvent(eventData);

    // Return the created event
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("API Events: Error creating event:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear el evento" },
      { status: 500 }
    );
  }
}
