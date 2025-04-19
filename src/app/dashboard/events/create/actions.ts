"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { EventFormValues } from "./ui/EventForm";
import { ImageObject } from "@/components/ui/cloudinary-upload";

// Helper function to get the base URL
async function getBaseUrl() {
  // Check for environment variables first
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // In development, use localhost
  return "http://localhost:3000";
}

export async function createEvent(formData: EventFormValues) {
  // Create independent copy of images to avoid reference issues
  const images = formData.images || [];
  const imagesCopy = JSON.parse(JSON.stringify(images));

  // Prepare data to send
  const dataToSend = {
    title: formData.title,
    description: formData.description,
    dates: formData.dates,
    location: formData.location,
    time: formData.time,
    price: formData.price ? parseFloat(formData.price) : undefined,
    genre: formData.genre,
    organizerName: formData.organizerName,
    images: imagesCopy.map((img: ImageObject) => ({
      url: img.url,
      alt: img.alt || "Event image",
      public_id: img.public_id || undefined,
    })),
  };

  // Log image data for debug purposes
  if (dataToSend.images.length > 0) {
    console.log(`Sending ${dataToSend.images.length} images`);
  }

  try {
    // Get cookies to include auth token
    const cookieStore = cookies();
    const cookieHeader = cookieStore.toString();

    // Construct the full URL
    const baseUrl = await getBaseUrl();
    const apiUrl = `${baseUrl}/api/events`;

    console.log(`Making API request to: ${apiUrl}`);

    // Send data to the API endpoint
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Include auth cookie if available
        Cookie: cookieHeader,
      },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al crear el evento");
    }

    // Revalidate the events and dashboard paths
    revalidatePath("/events");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error creating event:", error);
    throw new Error(error instanceof Error ? error.message : "Error al crear el evento");
  }
}
