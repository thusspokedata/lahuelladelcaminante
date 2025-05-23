"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";
import Image from "next/image";
import { X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCloudinaryImage } from "@/services/cloudinary";

export interface ImageObject {
  url: string;
  alt?: string;
  public_id?: string;
  isProfile?: boolean;
}

interface CloudinaryUploadProps {
  onChange: (url: string, alt?: string, public_id?: string) => void;
  onRemove: (url: string) => void;
  value: ImageObject[];
  disabled?: boolean;
  maxImages?: number;
  uploadPreset?: string;
  deleteFromCloudinary?: boolean;
  isProfileSelector?: boolean;
  onProfileSelect?: (index: number) => void;
  profileImageIndex?: number;
}

const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  onChange,
  onRemove,
  value = [],
  disabled,
  maxImages = 5,
  uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  deleteFromCloudinary = true,
  isProfileSelector = false,
  onProfileSelect,
  profileImageIndex,
}) => {
  const t = useTranslations("events.imageUpload");

  const [isMounted, setIsMounted] = useState(false);
  const [localImages, setLocalImages] = useState<ImageObject[]>(value);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const maxReached = maxImages > 0 && localImages.length >= maxImages;

  // Check for required environment variables
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const cloudApiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

  // Environment variable validation - show error if missing
  useEffect(() => {
    if (isMounted) {
      if (!cloudName) {
        setError("Cloudinary configuration error: Missing cloud name");
      } else if (!uploadPreset) {
        setError("Cloudinary configuration error: Missing upload preset");
      } else if (!cloudApiKey) {
        setError("Cloudinary configuration error: Missing API key");
      } else {
        // Clear error if all is good
        setError(null);
      }
    }
  }, [isMounted, cloudName, uploadPreset, cloudApiKey]);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);

    // Initialize local images with prop value
    if (Array.isArray(value)) {
      setLocalImages(value);
    }
  }, [uploadPreset, value]);

  // Synchronize value prop changes with local state
  useEffect(() => {
    if (isMounted && Array.isArray(value)) {
      setLocalImages(value);
    }
  }, [value, isMounted]);

  if (!isMounted) {
    return null;
  }

  const onUpload = (result: CloudinaryUploadWidgetResults) => {
    try {
      setIsUploading(true);

      if (!result?.info) {
        setError("No upload result info received");
        return;
      }

      if (typeof result.info !== "object") {
        setError("Invalid upload result format");
        return;
      }

      if (!("secure_url" in result.info)) {
        setError("No secure_url in upload result");
        return;
      }

      // Extract the public_id (ensure public_id exists)
      let publicId = "";
      if ("public_id" in result.info) {
        publicId = result.info.public_id as string;
      }

      // Extract filename for alt text
      const filename = publicId.split("/").pop() || "Image";

      // Create the image object with all possible data
      const imageData = {
        url: result.info.secure_url as string,
        public_id: publicId,
        alt: filename,
        isProfile: isProfileSelector && localImages.length === 0,
      };

      // Update local images
      const updatedImages = [...localImages, imageData];
      setLocalImages(updatedImages);

      // Call the onChange handler - explicitly passing all values
      onChange(imageData.url, imageData.alt, imageData.public_id);

      // If this is the first image and profile selector is enabled, make it the profile
      if (isProfileSelector && localImages.length === 0 && onProfileSelect) {
        onProfileSelect(localImages.length);
      }
    } catch (err) {
      setError(`Error processing upload: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (url: string) => {
    try {
      setIsDeleting(true);

      // Find the image to remove
      const imageToRemove = localImages.find((img) => img.url === url);
      const indexToRemove = localImages.findIndex((img) => img.url === url);

      // Handle profile image selection if needed
      if (isProfileSelector && profileImageIndex === indexToRemove && onProfileSelect) {
        onProfileSelect(-1); // No profile image selected
      } else if (
        isProfileSelector &&
        profileImageIndex !== undefined &&
        profileImageIndex > indexToRemove &&
        onProfileSelect
      ) {
        // If we're removing an image before the profile image, adjust the index
        onProfileSelect(profileImageIndex - 1);
      }

      // Delete from Cloudinary if enabled and we have a public_id
      if (deleteFromCloudinary && imageToRemove?.public_id) {
        const result = await deleteCloudinaryImage(imageToRemove.public_id);

        if (!result.success) {
          console.warn("Could not delete image from Cloudinary:", result.message);
          // Continue with removal even if Cloudinary deletion failed
        }
      }

      // Update local images
      const updatedImages = localImages.filter((img) => img.url !== url);
      setLocalImages(updatedImages);

      // Call the onRemove handler provided by parent
      onRemove(url);
    } catch (err) {
      setError(`Error removing image: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error removing image:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetAsProfile = (index: number) => {
    if (isProfileSelector && onProfileSelect) {
      onProfileSelect(index);
    }
  };

  return (
    <div className="w-full space-y-4">
      {localImages.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {localImages.map((image, index) => (
            <div
              key={image.url}
              className={`relative h-[200px] w-[200px] overflow-hidden rounded-md ${
                isProfileSelector && profileImageIndex === index
                  ? "ring-primary border-primary ring-2"
                  : "border-2 border-gray-300"
              }`}
            >
              <div className="absolute top-2 right-2 z-10">
                <Button
                  type="button"
                  onClick={() => handleRemoveImage(image.url)}
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  disabled={disabled || isDeleting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isProfileSelector && profileImageIndex !== index && (
                <div className="absolute right-2 bottom-2 z-10">
                  <Button
                    type="button"
                    onClick={() => handleSetAsProfile(index)}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                  >
                    {t("setAsProfile")}
                  </Button>
                </div>
              )}

              {isProfileSelector && profileImageIndex === index && (
                <div className="bg-primary absolute top-2 left-2 z-10 rounded-full px-2 py-1 text-xs text-white">
                  {t("profile")}
                </div>
              )}

              <Image
                fill
                alt={image.alt || "Uploaded image"}
                src={image.url}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!maxReached && !error && (
        <CldUploadWidget
          uploadPreset={uploadPreset}
          onSuccess={onUpload}
          options={{
            cloudName: cloudName,
            sources: ["local", "url", "camera"],
            multiple: false,
          }}
        >
          {({ open }) => {
            return (
              <Button
                type="button"
                disabled={disabled || isUploading || isDeleting || !cloudName || !uploadPreset}
                variant="outline"
                onClick={() => {
                  open();
                }}
                className="gap-2"
              >
                <ImagePlus className="h-4 w-4" />
                {t("upload")} {isUploading && `(${t("uploading")})`}{" "}
                {isDeleting && `(${t("deleting")})`}
              </Button>
            );
          }}
        </CldUploadWidget>
      )}
    </div>
  );
};

export default CloudinaryUpload;
