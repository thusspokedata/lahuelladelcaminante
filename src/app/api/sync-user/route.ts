import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByClerkId } from "@/services/users";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user exists in our database
    const existingUser = await getUserByClerkId(userId);

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "User already exists in database",
        userId: existingUser.id,
      });
    }

    // Extract user data from request body
    const { email, firstName, lastName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Create user in database
    const newUser = await createUser({
      clerkId: userId,
      email,
      firstName,
      lastName,
    });

    return NextResponse.json({
      success: true,
      message: "User synchronized successfully",
      userId: newUser.id,
    });
  } catch (error) {
    console.error("Error synchronizing user:", error);
    return NextResponse.json(
      {
        error: "Failed to synchronize user",
      },
      { status: 500 }
    );
  }
}
