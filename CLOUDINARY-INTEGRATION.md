# Cloudinary Integration

This document provides an overview of the Cloudinary integration implemented in this project.

## Overview

Cloudinary is a cloud-based service that provides an end-to-end image and video management solution including uploads, storage, manipulations, optimizations and delivery.

In this project, Cloudinary is used for:

1. Uploading and storing images for events and artists
2. Managing image metadata
3. Automatic cleanup of unused images

## Components

### 1. CloudinaryUpload Component

Located at `src/components/ui/cloudinary-upload.tsx`, this is a reusable React component that provides:

- Image upload via Cloudinary widget
- Preview of uploaded images
- Ability to remove images
- Automatic deletion from Cloudinary when images are removed

#### Usage Example:

```tsx
import CloudinaryUpload, { ImageObject } from "@/components/ui/cloudinary-upload";

// In your component
const [images, setImages] = useState<ImageObject[]>([]);

const handleImageChange = (url: string, alt?: string, public_id?: string) => {
  setImages((prev) => [...prev, { url, alt, public_id }]);
};

const handleImageRemove = (url: string) => {
  setImages((prev) => prev.filter((img) => img.url !== url));
};

// In your JSX
<CloudinaryUpload
  onChange={handleImageChange}
  onRemove={handleImageRemove}
  value={images}
  maxImages={5}
  deleteFromCloudinary={true}
/>;
```

### 2. Cloudinary Service

Located at `src/services/cloudinary.ts`, this service provides methods for interacting with Cloudinary:

- `deleteCloudinaryImage`: Deletes an image from Cloudinary using the image's public_id

### 3. API Endpoint for Image Deletion

Located at `src/app/api/cloudinary/delete/route.ts`, this secure API endpoint handles image deletion requests:

- Validates user authentication
- Requires a valid public_id
- Interfaces with the Cloudinary API to delete images

## Configuration

### Environment Variables

The following environment variables must be set:

```
# Cloudinary Server-side Variables
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cloudinary Client-side Variables
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### Cloudinary Upload Preset

For client-side uploads, you need to create an upload preset in the Cloudinary dashboard:

1. Log into your Cloudinary console
2. Navigate to Settings > Upload
3. Scroll down to "Upload presets"
4. Click "Add upload preset"
5. Configure the preset:
   - Signing Mode: Unsigned
   - Folder: (optional) Specify a folder for uploads
   - Access Mode: public
6. Save and use the preset name in your environment variables

## Database Schema

The `Image` model in Prisma has been updated to include a `public_id` field:

```prisma
model Image {
  id        String   @id @default(cuid())
  url       String
  alt       String
  public_id String?  // Cloudinary public_id for later management
  event     Event?   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId   String?
  artist    Artist?  @relation(fields: [artistId], references: [id], onDelete: Cascade)
  artistId  String?
  createdAt DateTime @default(now())
}
```

## Image Lifecycle

1. **Upload**: Images are uploaded via the CloudinaryUpload component
2. **Storage**: Image data (URL, public_id, alt text) is stored in the database
3. **Display**: Images are displayed in event/artist details
4. **Deletion**: When an image is removed from an event/artist, it's also deleted from Cloudinary

## Best Practices

1. Always store the `public_id` returned by Cloudinary to enable future management
2. Use the CloudinaryUpload component's built-in deletion functionality to ensure images are removed from Cloudinary
3. Consider implementing a cleanup job to remove orphaned images from Cloudinary
