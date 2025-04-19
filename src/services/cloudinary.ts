/**
 * Service for handling Cloudinary operations
 */

/**
 * Delete an image from Cloudinary
 * @param publicId The public_id of the image to delete
 * @returns Promise with the result of the deletion operation
 */
export async function deleteCloudinaryImage(
  publicId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    if (!publicId) {
      return { success: false, message: "No publicId provided" };
    }

    const response = await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message:
          errorData.message || `Error deleting image: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    console.error("Error deleting Cloudinary image:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error deleting image",
    };
  }
}
