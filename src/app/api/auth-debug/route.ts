import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(_request: NextRequest) {
  try {
    // Get both auth methods for comparison
    const authResult = await auth();
    const clerkUser = await currentUser();

    console.log("Debug endpoint auth check:", {
      userId: authResult.userId,
      hasClerkUser: !!clerkUser,
      clerkUserId: clerkUser?.id,
    });

    return NextResponse.json({
      authResult: {
        userId: authResult.userId,
        sessionId: authResult.sessionId,
        sessionClaims: authResult.sessionClaims,
      },
      clerkUser: clerkUser
        ? {
            id: clerkUser.id,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            emailAddresses: clerkUser.emailAddresses.map((email) => email.emailAddress),
          }
        : null,
      headers: {
        cookie: _request.headers.get("cookie") ? "Present" : "Missing",
        authorization: _request.headers.get("authorization") ? "Present" : "Missing",
      },
    });
  } catch (error) {
    console.error("Error in auth debug route:", error);
    return NextResponse.json(
      {
        error: "Error checking authentication",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
