"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Artist } from "@/types";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { updateArtist } from "./actions";
import CloudinaryUpload from "@/components/ui/cloudinary-upload";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface ArtistFormProps {
  artist: Artist;
}

export default function ArtistForm({ artist }: ArtistFormProps) {
  const t = useTranslations("artists");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGenre, setNewGenre] = useState("");
  const { toast } = useToast();

  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(2, {
      message: t("form.nameValidation", { length: 2 }),
    }),
    bio: z.string().min(10, {
      message: t("form.bioValidation", { length: 10 }),
    }),
    origin: z.string().min(2, {
      message: t("form.originValidation", { length: 2 }),
    }),
    genres: z.array(z.string()).min(1, {
      message: t("form.genresValidation"),
    }),
    socialMedia: z.object({
      instagram: z.string().optional(),
      spotify: z.string().optional(),
      youtube: z.string().optional(),
      website: z.string().optional(),
      tiktok: z.string().optional(),
    }),
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

  // Define form values type
  type FormValues = z.infer<typeof formSchema>;

  // Initialize form with artist data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: artist.name,
      bio: artist.bio,
      origin: artist.origin,
      genres: artist.genres || [],
      socialMedia: {
        instagram: artist.socialMedia?.instagram || "",
        spotify: artist.socialMedia?.spotify || "",
        youtube: artist.socialMedia?.youtube || "",
        website: artist.socialMedia?.website || "",
        tiktok: artist.socialMedia?.tiktok || "",
      },
      images: artist.images || [],
    },
  });

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const result = await updateArtist(artist.id, values);

      if (result.success) {
        toast({
          title: t("form.updateSuccess.title"),
          description: t("form.updateSuccess.description", { name: values.name }),
        });
      } else {
        toast({
          title: t("form.error"),
          description: result.error || t("form.updateError"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: t("form.error"),
        description: t("form.updateError"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle adding a new genre
  const handleAddGenre = () => {
    if (!newGenre.trim()) return;

    const currentGenres = form.getValues("genres") || [];
    if (!currentGenres.includes(newGenre.trim())) {
      form.setValue("genres", [...currentGenres, newGenre.trim()]);
    }
    setNewGenre("");
  };

  // Handle removing a genre
  const handleRemoveGenre = (genreToRemove: string) => {
    const currentGenres = form.getValues("genres") || [];
    form.setValue(
      "genres",
      currentGenres.filter((genre) => genre !== genreToRemove)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Artist Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.name")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("form.namePlaceholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Origin */}
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("origin")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("form.originPlaceholder")} />
                    </FormControl>
                    <FormDescription>{t("form.originDescription")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bio")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={t("form.bioPlaceholder")} rows={6} />
                    </FormControl>
                    <FormDescription>{t("form.bioDescription")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Genres */}
              <FormField
                control={form.control}
                name="genres"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("genres")}</FormLabel>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {form.watch("genres")?.map((genre) => (
                        <Badge key={genre} variant="secondary">
                          {genre}
                          <button
                            type="button"
                            onClick={() => handleRemoveGenre(genre)}
                            className="ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value)}
                        placeholder={t("form.newGenrePlaceholder")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddGenre();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddGenre}>
                        {t("form.addGenre")}
                      </Button>
                    </div>
                    <FormDescription>{t("form.genresDescription")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Social Media */}
              <div className="space-y-4">
                <FormLabel>{t("socialMedia")}</FormLabel>
                <FormDescription>{t("form.socialMedia.description")}</FormDescription>

                <FormField
                  control={form.control}
                  name="socialMedia.instagram"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <div className="w-24">
                          <FormLabel>{t("form.socialMedia.instagram")}</FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("form.socialMedia.instagramPlaceholder")}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialMedia.spotify"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <div className="w-24">
                          <FormLabel>{t("form.socialMedia.spotify")}</FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("form.socialMedia.spotifyPlaceholder")}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialMedia.youtube"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <div className="w-24">
                          <FormLabel>{t("form.socialMedia.youtube")}</FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("form.socialMedia.youtubePlaceholder")}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialMedia.website"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <div className="w-24">
                          <FormLabel>{t("form.socialMedia.website")}</FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("form.socialMedia.websitePlaceholder")}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="socialMedia.tiktok"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <div className="w-24">
                          <FormLabel>{t("form.socialMedia.tiktok")}</FormLabel>
                        </div>
                        <FormControl>
                          <Input {...field} placeholder={t("form.socialMedia.tiktokPlaceholder")} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Images */}
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.images.title")}</FormLabel>
                    <FormControl>
                      <CloudinaryUpload
                        value={field.value || []}
                        onChange={field.onChange}
                        onRemove={(index) => {
                          const newImages = [...(field.value || [])];
                          newImages.splice(Number(index), 1);
                          field.onChange(newImages);
                        }}
                        maxImages={5}
                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      />
                    </FormControl>
                    <FormDescription>{t("form.images.description")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("form.updating") : t("form.updateArtist")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
