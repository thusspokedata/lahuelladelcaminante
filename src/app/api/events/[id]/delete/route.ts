import { NextRequest, NextResponse } from "next/server";
import { deleteEvent, getEventById } from "@/services/events";
// Auth will be implemented properly with Clerk later

type Params = Promise<{ id: string }>;

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  try {
    // Authentication will be implemented with Clerk later
    // Temporary authentication bypass for development
    const isAuthenticated = true; // Will be replaced with actual auth check

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = id;

    // Check if the event exists
    const existingEvent = await getEventById(eventId, { includeDeleted: true });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if already deleted
    if (existingEvent.isDeleted) {
      return NextResponse.json({ error: "Event is already marked as deleted" }, { status: 400 });
    }

    // Perform soft delete
    const deletedEvent = await deleteEvent(eventId);

    return NextResponse.json({
      message: "Event successfully deleted",
      event: deletedEvent,
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
