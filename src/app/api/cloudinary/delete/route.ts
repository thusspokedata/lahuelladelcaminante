import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

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

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

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
