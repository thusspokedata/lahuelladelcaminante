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
          error: "No authorized. You must log in to create events.",
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
          error: "User not found in database.",
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
            "Your account must be active to create events. Current status: " + currentUser.status,
        },
        { status: 403 }
      );
    }

    // Get event data from request body
    const data = await request.json();

    // Verify image data
    console.log("API received event data:", {
      title: data.title,
      hasImages: !!data.images,
      imagesCount: data.images ? data.images.length : 0,
      imagesExample: data.images && data.images.length > 0 ? data.images[0] : null,
      // Log full raw data for debugging
      rawImages: JSON.stringify(data.images),
    });

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
      // Images already come as objects with url and alt
      images: data.images || [],
    };

    // Verify image data after transformation
    console.log(
      "Image data prepared for event creation:",
      eventData.images ? JSON.stringify(eventData.images, null, 2) : "No images"
    );

    // Create the event
    console.log("API Events: Creating event for user:", currentUser.id);
    const newEvent = await createEvent(eventData);

    // Return the created event
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("API Events: Error creating event:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creating event" },
      { status: 500 }
    );
  }
}
