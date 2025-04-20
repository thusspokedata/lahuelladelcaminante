/**
 * Deletes an image from Cloudinary
 * @param publicId The public_id of the image to delete
 * @returns Result object indicating success or failure
 */
export async function deleteCloudinaryImage(
  publicId: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const response = await fetch("/api/cloudinary/delete-internal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || "Failed to delete image" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting Cloudinary image:", error);
    return { success: false, error };
  }
}
