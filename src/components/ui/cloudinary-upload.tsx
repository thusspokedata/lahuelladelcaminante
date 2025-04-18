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
  const [localImages, setLocalImages] = useState<ImageObject[]>([]);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
    console.log("CloudinaryUpload mounted with values:", {
      value,
      valueLength: value?.length || 0,
      valueIsArray: Array.isArray(value),
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      uploadPreset: uploadPreset,
    });

    // Inicializar imágenes locales con el valor prop
    if (Array.isArray(value)) {
      setLocalImages(value);
    }

    // Log individual images if they exist
    if (Array.isArray(value) && value.length > 0) {
      console.log("Initial images:", JSON.stringify(value, null, 2));
    }
  }, [uploadPreset, value]);

  // Sincronizar cambios de value prop con estado local
  useEffect(() => {
    if (isMounted && Array.isArray(value)) {
      setLocalImages(value);
      console.log("CloudinaryUpload value changed:", {
        valueLength: value?.length || 0,
        valueIsArray: Array.isArray(value),
        localImagesLength: localImages.length,
      });
    }
  }, [value, isMounted]);

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
      console.log("Current images before adding new one:", JSON.stringify(localImages, null, 2));

      // Actualizar imágenes locales
      const updatedImages = [...localImages, imageData];
      setLocalImages(updatedImages);

      // Call the onChange handler
      onChange(imageData.url, imageData.alt, imageData.public_id);
    } catch (err) {
      setError(`Error processing upload: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Error processing upload:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (url: string) => {
    console.log("Removing image with URL:", url);
    console.log("Current images before removing:", JSON.stringify(localImages, null, 2));

    // Actualizar imágenes locales
    const updatedImages = localImages.filter((img) => img.url !== url);
    setLocalImages(updatedImages);

    // Call the onRemove handler provided by parent
    onRemove(url);
  };

  const hasReachedLimit = maxImages > 0 && localImages.length >= maxImages;

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
        <strong>Current images:</strong> {localImages?.length || 0} (prop value:{" "}
        {value?.length || 0})
      </p>
      <p>
        <strong>Is Array:</strong> {Array.isArray(localImages) ? "Yes" : "No"}
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
      {Array.isArray(localImages) && localImages.length > 0 && (
        <details>
          <summary>Current Images Data</summary>
          <pre className="max-h-32 overflow-auto">{JSON.stringify(localImages, null, 2)}</pre>
        </details>
      )}
    </div>
  );

  return (
    <div>
      {debugInfo}

      <div className="mb-4 flex flex-wrap items-center gap-4">
        {Array.isArray(localImages) && localImages.length > 0 ? (
          localImages.map((image, idx) => (
            <div
              key={`${image.url}-${idx}`}
              className="relative h-[200px] w-[200px] overflow-hidden rounded-md border-2 border-gray-300"
            >
              <div className="absolute top-2 right-2 z-10">
                <Button
                  type="button"
                  onClick={() => handleRemoveImage(image.url)}
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
              <div className="absolute right-0 bottom-0 left-0 flex flex-col bg-black/60 p-1 text-[10px] text-white">
                <span className="truncate font-medium">{image.alt || "Sin nombre"}</span>
                {image.public_id && (
                  <span className="truncate text-[9px] opacity-70">
                    ID: {image.public_id.substring(0, 15)}...
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-[200px] w-full items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
            No hay imágenes. Haz clic en &ldquo;Subir imagen&rdquo; para agregar.
          </div>
        )}
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
                    currentImagesCount: localImages?.length || 0,
                  });
                  open();
                }}
                className="gap-2"
              >
                <ImagePlus className="h-4 w-4" />
                Subir imagen {isUploading && "(Subiendo...)"}
              </Button>
            );
          }}
        </CldUploadWidget>
      )}
    </div>
  );
};

export default CloudinaryUpload;
