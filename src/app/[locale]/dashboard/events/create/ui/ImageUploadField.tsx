"use client";

import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import CloudinaryUpload, { ImageObject } from "@/components/ui/cloudinary-upload";
import { EventFormValues } from "./EventForm";

interface ImageUploadFieldProps {
  form: UseFormReturn<EventFormValues>;
  disabled?: boolean;
}

export default function ImageUploadField({ form, disabled = false }: ImageUploadFieldProps) {
  const t = useTranslations("events.imageUpload");

  return (
    <FormField
      control={form.control}
      name="images"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("images")}</FormLabel>
          <FormControl>
            <CloudinaryUpload
              value={(field.value as ImageObject[]) || []}
              disabled={disabled}
              onChange={(url: string, alt?: string, public_id?: string) => {
                // Create new image object
                const newImage: ImageObject = {
                  url,
                  alt: alt || form.getValues().title || "Event image",
                  public_id,
                };

                // Add to existing images
                const currentImages = Array.isArray(field.value) ? field.value : [];
                const updatedImages = [...currentImages, newImage];

                // Update form field
                field.onChange(updatedImages);
                form.setValue("images", updatedImages, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              onRemove={(url: string) => {
                // Filter out removed image
                const currentImages = Array.isArray(field.value) ? field.value : [];
                const updatedImages = currentImages.filter((img: ImageObject) => img.url !== url);

                // Update form field
                field.onChange(updatedImages);
                form.setValue("images", updatedImages, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
          </FormControl>
          <FormDescription>{t("uploadDescription")}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
