import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

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
    const result = await deleteCloudinaryImage(publicId);

    if (result.success) {
      return NextResponse.json({
        message: "Image deleted successfully",
        result,
      });
    } else {
      console.error("Error deleting image from Cloudinary:", result.error);
      return NextResponse.json(
        { message: "Failed to delete image", error: result.error },
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
