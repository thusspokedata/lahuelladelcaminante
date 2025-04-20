import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { publicId } = body;

    if (!publicId) {
      return NextResponse.json({ message: "Missing public_id" }, { status: 400 });
    }

    // Using native fetch with Cloudinary API
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ message: "Cloudinary configuration missing" }, { status: 500 });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = generateSHA1(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`);

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("timestamp", timestamp.toString());
    formData.append("api_key", apiKey);
    formData.append("signature", signature);

    const deleteUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;

    const response = await fetch(deleteUrl, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.result === "ok" || result.result === "not found") {
      return NextResponse.json({
        message: "Image deleted successfully",
        result,
      });
    } else {
      console.error("Error deleting image from Cloudinary:", result);
      return NextResponse.json(
        { message: "Failed to delete image", error: result },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in Cloudinary delete route:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

// Helper function to generate SHA1 hash
function generateSHA1(message: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha1").update(message).digest("hex");
}
