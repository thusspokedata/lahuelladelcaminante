"use client";

import { useState, useTransition, useEffect } from "react";
import { CldUploadWidget, CloudinaryUploadWidgetResults } from "next-cloudinary";
import Image from "next/image";
import { X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CloudinaryUploadProps {
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string[];
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
        onChange(result.info.secure_url as string);
      }
    });
  };

  const hasReachedLimit = maxImages > 0 && value.length >= maxImages;

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        {value.map((url) => (
          <div key={url} className="relative h-[200px] w-[200px] overflow-hidden rounded-md">
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                onClick={() => onRemove(url)}
                variant="destructive"
                size="icon"
                className="h-7 w-7 rounded-full"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Image fill className="object-cover" alt="Event image" src={url} sizes="200px" />
          </div>
        ))}
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
