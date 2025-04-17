import { NextRequest, NextResponse } from "next/server";
import { getDeletedEvents } from "@/services/events";
// Auth will be implemented properly with Clerk later

export async function GET(_request: NextRequest) {
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

    // Get all deleted events
    const deletedEvents = await getDeletedEvents();

    return NextResponse.json({
      events: deletedEvents,
    });
  } catch (error) {
    console.error("Error fetching deleted events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
