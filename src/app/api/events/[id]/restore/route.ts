import { NextRequest, NextResponse } from "next/server";
import { restoreEvent, getEventById } from "@/services/events";
// Auth will be implemented properly with Clerk later

type Params = Promise<{ id: string }>;

export async function POST(_request: NextRequest, { params }: { params: Params }) {
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

    // Check if not deleted
    if (!existingEvent.isDeleted) {
      return NextResponse.json({ error: "Event is not marked as deleted" }, { status: 400 });
    }

    // Restore event
    const restoredEvent = await restoreEvent(eventId);

    return NextResponse.json({
      message: "Event successfully restored",
      event: restoredEvent,
    });
  } catch (error) {
    console.error("Error restoring event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
