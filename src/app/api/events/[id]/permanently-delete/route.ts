import { NextRequest, NextResponse } from "next/server";
import { permanentlyDeleteEvent, getEventById } from "@/services/events";
// Auth will be implemented properly with Clerk later

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentication will be implemented with Clerk later
    // Temporary authentication bypass for development
    const isAuthenticated = true; // Will be replaced with actual auth check
    const isAdmin = true; // Will be replaced with actual role check

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const eventId = params.id;

    // Check if the event exists
    const existingEvent = await getEventById(eventId, { includeDeleted: true });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Perform permanent delete
    await permanentlyDeleteEvent(eventId);

    return NextResponse.json({
      message: "Event permanently deleted",
    });
  } catch (error) {
    console.error("Error permanently deleting event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
