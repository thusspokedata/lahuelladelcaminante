import { NextRequest, NextResponse } from "next/server";
import { hasRole } from "@/services/auth";

export async function GET(_request: NextRequest) {
  try {
    // Check if the current user has the ADMIN role
    const isAdmin = await hasRole("ADMIN");

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ error: "Failed to check admin status" }, { status: 500 });
  }
}
