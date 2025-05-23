"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DateSelector from "./DateSelector";
import ImageUploadField from "./ImageUploadField";
import { ArtistSelector } from "./ArtistSelector";

// Define the form schema base shape
const baseFormSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  artists: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      bio: z.string().optional(),
    })
  ),
  dates: z.array(z.date()).min(1),
  location: z.string().min(3),
  time: z.string().min(1),
  price: z.string().optional(),
  genre: z.string().min(1),
  organizerName: z.string().min(3),
  images: z
    .array(
      z.object({
        url: z.string(),
        alt: z.string().optional(),
        public_id: z.string().optional(),
      })
    )
    .optional(),
});

// Type for the form
export type EventFormValues = z.infer<typeof baseFormSchema>;

type FormArtist = {
  id: string;
  name: string;
  bio?: string;
};

interface EventFormProps {
  onSubmit: (values: EventFormValues) => Promise<void>;
  isSubmitting?: boolean;
  initialError?: string | null;
  initialData?: EventFormValues | null;
}

export default function EventForm({
  onSubmit,
  isSubmitting = false,
  initialError = null,
  initialData = null,
}: EventFormProps) {
  const t = useTranslations("events.create.form");
  const tCommon = useTranslations("common");

  const [error, setError] = useState<string | null>(initialError);
  const isEditMode = Boolean(initialData);
  const [cloudinaryReady, setCloudinaryReady] = useState(false);
  const [cloudinaryError, setCloudinaryError] = useState<string | null>(null);

  // Create schema with translated error messages
  const formSchema = baseFormSchema.superRefine((data, ctx) => {
    if (data.title.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 3,
        type: "string",
        inclusive: true,
        path: ["title"],
        message: `${t("title")} must have at least 3 characters`,
      });
    }

    if (data.description.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 10,
        type: "string",
        inclusive: true,
        path: ["description"],
        message: `${t("description")} must have at least 10 characters`,
      });
    }

    if (data.dates.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: "array",
        inclusive: true,
        path: ["dates"],
        message: "Select at least one date",
      });
    }

    if (data.location.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 3,
        type: "string",
        inclusive: true,
        path: ["location"],
        message: `${t("location")} must have at least 3 characters`,
      });
    }

    if (data.time.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        path: ["time"],
        message: `${t("time")} is required`,
      });
    }

    if (data.genre.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        path: ["genre"],
        message: `${t("genre")} is required`,
      });
    }

    if (data.organizerName.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 3,
        type: "string",
        inclusive: true,
        path: ["organizerName"],
        message: `${t("organizer")} must have at least 3 characters`,
      });
    }
  });

  // Initialize form with React Hook Form and Zod
  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      artists: [] as FormArtist[],
      dates: [] as Date[],
      location: "",
      time: "",
      price: "",
      genre: "",
      organizerName: "",
      images: [],
    },
  });

  // Check if Cloudinary variables are available
  useEffect(() => {
    // Wait for client-side execution
    const checkCloudinaryConfig = () => {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName) {
        setCloudinaryError("Cloudinary configuration missing: Cloud name not available");
        return false;
      }

      if (!uploadPreset) {
        setCloudinaryError("Cloudinary configuration missing: Upload preset not available");
        return false;
      }

      setCloudinaryError(null);
      return true;
    };

    // Small delay to ensure browser has loaded environment variables
    const timer = setTimeout(() => {
      setCloudinaryReady(checkCloudinaryConfig());
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  // Handle form submission
  const handleSubmit: SubmitHandler<EventFormValues> = async (values) => {
    setError(null);
    try {
      await onSubmit(values);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error al procesar el evento");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("eventInfo")}</CardTitle>
        <CardDescription>
          {isEditMode ? t("editDescription") : t("createDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{tCommon("error")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {cloudinaryError && (
          <Alert variant="default" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("warning")}</AlertTitle>
            <AlertDescription>
              {cloudinaryError}
              <p className="mt-2">{t("imageUnavailable")}</p>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Event title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("title")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("titlePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organizer */}
              <FormField
                control={form.control}
                name="organizerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("organizer")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("organizerPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Artist Selector */}
            <FormField
              control={form.control}
              name="artists"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ArtistSelector value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("descriptionPlaceholder")}
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("location")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("locationPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time */}
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("time")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("timePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("price")}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={t("pricePlaceholder")} {...field} />
                    </FormControl>
                    <FormDescription>{t("freeEvent")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Genre */}
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("genre")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("genrePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <DateSelector form={form} />

            {/* Images - Render only if Cloudinary is properly configured */}
            {cloudinaryReady && <ImageUploadField form={form} disabled={isSubmitting} />}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? t("updating")
                  : t("creating")
                : isEditMode
                  ? t("update")
                  : t("create")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
