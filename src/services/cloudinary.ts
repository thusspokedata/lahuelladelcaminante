import "server-only"

import { v2 as cloudinary } from "cloudinary"
import { env } from "@/lib/env"

cloudinary.config({
  cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

export async function deleteImages(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return
  await cloudinary.api.delete_resources(publicIds)
}
