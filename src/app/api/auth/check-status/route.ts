import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth";

export async function GET(_request: NextRequest) {
  try {
    // Get the current user from auth service
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ status: null }, { status: 401 });
    }

    return NextResponse.json({ status: user.status });
  } catch (error) {
    console.error("Error checking user status:", error);
    return NextResponse.json({ error: "Failed to check user status" }, { status: 500 });
  }
}
