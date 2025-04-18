"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";
import Image from "next/image";
import { X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ImageObject {
  url: string;
  alt?: string;
  public_id?: string;
}

interface CloudinaryUploadProps {
  onChange: (url: string, alt?: string, public_id?: string) => void;
  onRemove: (url: string) => void;
  value: ImageObject[];
  disabled?: boolean;
  maxImages?: number;
  uploadPreset?: string;
}

const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  onChange,
  onRemove,
  value = [],
  disabled,
  maxImages = 5,
  uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<CloudinaryUploadWidgetResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
    console.log("CloudinaryUpload mounted with values:", {
      value,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      uploadPreset: uploadPreset,
    });
  }, []);

  if (!isMounted) {
    return null;
  }

  const onUpload = (result: CloudinaryUploadWidgetResults) => {
    // Store the raw result for debugging
    setUploadResult(result);
    setIsUploading(true);

    try {
      if (!result?.info) {
        setError("No upload result info received");
        console.error("No upload result info received", result);
        return;
      }

      if (typeof result.info !== "object") {
        setError("Invalid upload result format");
        console.error("Invalid upload result format", result);
        return;
      }

      if (!("secure_url" in result.info)) {
        setError("No secure_url in upload result");
        console.error("No secure_url in upload result", result);
        return;
      }

      // Extract the public_id
      const publicId = "public_id" in result.info ? (result.info.public_id as string) : "";
      // Extract filename for alt text
      const filename = publicId.split("/").pop() || "Image";

      // Create the image object
      const imageData = {
        url: result.info.secure_url as string,
        public_id: publicId,
        alt: filename,
      };

      console.log("Successfully extracted image data:", imageData);

      // Call the onChange handler
      onChange(imageData.url, imageData.alt, imageData.public_id);
    } catch (err) {
      setError(`Error processing upload: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error processing upload:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const hasReachedLimit = maxImages > 0 && value.length >= maxImages;

  // Debug information display
  const debugInfo = (
    <div className="mb-4 rounded bg-gray-100 p-2 text-xs">
      <p>
        <strong>CloudName:</strong> {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}
      </p>
      <p>
        <strong>UploadPreset:</strong> {uploadPreset}
      </p>
      <p>
        <strong>Current images:</strong> {value?.length || 0}
      </p>
      {error && (
        <p className="text-red-500">
          <strong>Error:</strong> {error}
        </p>
      )}
      {uploadResult && (
        <details>
          <summary>Last Upload Result</summary>
          <pre className="max-h-32 overflow-auto">{JSON.stringify(uploadResult, null, 2)}</pre>
        </details>
      )}
    </div>
  );

  return (
    <div>
      {debugInfo}

      <div className="mb-4 flex flex-wrap items-center gap-4">
        {Array.isArray(value) &&
          value.map((image, idx) => (
            <div
              key={`${image.url}-${idx}`}
              className="relative h-[200px] w-[200px] overflow-hidden rounded-md"
            >
              <div className="absolute top-2 right-2 z-10">
                <Button
                  type="button"
                  onClick={() => onRemove(image.url)}
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Image
                fill
                className="object-cover"
                alt={image.alt || "Event image"}
                src={image.url}
                sizes="200px"
              />
              {image.public_id && (
                <div className="absolute right-0 bottom-0 left-0 bg-black/50 p-1 text-[10px] text-white">
                  ID: {image.public_id.substring(0, 15)}...
                </div>
              )}
            </div>
          ))}
      </div>

      {!hasReachedLimit && (
        <CldUploadWidget
          uploadPreset={uploadPreset}
          onUpload={onUpload}
          options={{
            cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            sources: ["local", "url", "camera"],
            multiple: false,
          }}
        >
          {({ open }) => {
            return (
              <Button
                type="button"
                disabled={disabled || isUploading}
                variant="outline"
                onClick={() => {
                  console.log("Opening Cloudinary widget with:", {
                    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                    uploadPreset,
                  });
                  open();
                }}
                className="gap-2"
              >
                <ImagePlus className="h-4 w-4" />
                Subir imagen
              </Button>
            );
          }}
        </CldUploadWidget>
      )}
    </div>
  );
};

export default CloudinaryUpload;
