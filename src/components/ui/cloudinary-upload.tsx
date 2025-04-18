"use client";

import { useState, useTransition, useEffect } from "react";
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
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const onUpload = (result: CloudinaryUploadWidgetResults) => {
    startTransition(() => {
      if (result?.info && typeof result.info === "object" && "secure_url" in result.info) {
        // Show all information received from Cloudinary
        console.log("Complete Cloudinary result:", result.info);

        // Extract the public_id
        const publicId = "public_id" in result.info ? (result.info.public_id as string) : "";
        // Extract filename from public_id for the alt text
        const filename = publicId.split("/").pop() || "";

        // Create complete image object with all required properties
        const imageData = {
          url: result.info.secure_url as string,
          public_id: publicId,
          alt: filename || "Event image",
        };

        console.log("Data extracted from Cloudinary:", imageData);

        // Pass complete image object to parent component
        onChange(imageData.url, imageData.alt, imageData.public_id);
      } else {
        console.error("Error: No secure_url received from Cloudinary", result);
      }
    });
  };

  const hasReachedLimit = maxImages > 0 && value.length >= maxImages;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {value.map((image) => (
          <div key={image.url} className="relative h-[200px] w-[200px] overflow-hidden rounded-md">
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

        {value.length > 0 && (
          <div className="text-muted-foreground flex h-[200px] w-[200px] flex-col items-center justify-center rounded-md border border-dashed p-2 text-center text-sm">
            <p className="font-medium">
              {value.length} {value.length === 1 ? "imagen" : "imágenes"}
            </p>
            <p>seleccionada{value.length !== 1 ? "s" : ""}</p>
          </div>
        )}
      </div>
      {!hasReachedLimit && (
        <CldUploadWidget
          uploadPreset={uploadPreset}
          onUpload={onUpload}
          options={{ cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME }}
        >
          {({ open }) => {
            return (
              <Button
                type="button"
                disabled={disabled || isPending}
                variant="outline"
                onClick={() => open()}
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
