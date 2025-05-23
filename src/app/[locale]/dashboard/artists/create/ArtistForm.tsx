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
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { createArtist, updateArtist, deleteArtist } from "./actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { X, Trash2, AlertCircle } from "lucide-react";
import CloudinaryUpload from "@/components/ui/cloudinary-upload";
import { Artist } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslations } from "next-intl";

interface ArtistFormProps {
  userId: string;
  userArtists?: Artist[];
  initialArtistId?: string;
}

export default function ArtistForm({ userId, userArtists = [], initialArtistId }: ArtistFormProps) {
  const t = useTranslations("artists.form");
  const common = useTranslations("common");
  const validation = useTranslations("validation");

  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(2, {
      message: validation("minLength", { field: t("name"), length: 2 }),
    }),
    bio: z.string().min(10, {
      message: validation("minLength", { field: t("bio"), length: 10 }),
    }),
    origin: z.string().min(2, {
      message: validation("minLength", { field: t("origin"), length: 2 }),
    }),
    genres: z.array(z.string()).min(1, {
      message: validation("minItems", { field: t("genres"), count: 1 }),
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
          isProfile: z.boolean().optional(),
        })
      )
      .optional(),
    profileImageId: z.string().optional().nullable(),
  });

  // Define form values type
  type FormValues = z.infer<typeof formSchema>;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGenre, setNewGenre] = useState("");
  const [profileImageIndex, setProfileImageIndex] = useState<number>(-1);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(initialArtistId || null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [cloudinaryReady, setCloudinaryReady] = useState(false);
  const [cloudinaryError, setCloudinaryError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Check if Cloudinary variables are available
  useEffect(() => {
    // Wait for client-side execution
    const checkCloudinaryConfig = () => {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName) {
        setCloudinaryError(t("cloudinaryErrors.missingCloudName"));
        return false;
      }

      if (!uploadPreset) {
        setCloudinaryError(t("cloudinaryErrors.missingUploadPreset"));
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
  }, [t]);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      bio: "",
      origin: "",
      genres: [],
      socialMedia: {
        instagram: "",
        spotify: "",
        youtube: "",
        website: "",
        tiktok: "",
      },
      images: [],
      profileImageId: null,
    },
  });

  // Load selected artist data into form
  useEffect(() => {
    if (selectedArtistId) {
      const selectedArtist = userArtists.find((artist) => artist.id === selectedArtistId);
      if (selectedArtist) {
        form.reset({
          name: selectedArtist.name,
          bio: selectedArtist.bio,
          origin: selectedArtist.origin,
          genres: selectedArtist.genres,
          socialMedia: selectedArtist.socialMedia || {
            instagram: "",
            spotify: "",
            youtube: "",
            website: "",
            tiktok: "",
          },
          images: selectedArtist.images || [],
          profileImageId: selectedArtist.profileImageId || null,
        });

        // Set profile image index if needed
        if (
          selectedArtist.profileImageId &&
          selectedArtist.images &&
          selectedArtist.images.length > 0
        ) {
          const profileIdx = selectedArtist.images.findIndex(
            (img) => img.public_id === selectedArtist.profileImageId
          );
          setProfileImageIndex(profileIdx > -1 ? profileIdx : -1);
        } else {
          setProfileImageIndex(-1);
        }
      }
    } else {
      // Reset form when no artist is selected
      form.reset({
        name: "",
        bio: "",
        origin: "",
        genres: [],
        socialMedia: {
          instagram: "",
          spotify: "",
          youtube: "",
          website: "",
          tiktok: "",
        },
        images: [],
        profileImageId: null,
      });
      setProfileImageIndex(-1);
    }
  }, [selectedArtistId, userArtists, form]);

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      // Set profileImageId if a profile image is selected
      if (profileImageIndex >= 0 && values.images && values.images.length > profileImageIndex) {
        const profileImage = values.images[profileImageIndex];
        // The profileImageId should be the complete public_id of the image
        values.profileImageId = profileImage.public_id || null;
      } else {
        // If no profile image is selected, set to null
        values.profileImageId = null;
      }

      let result;

      if (selectedArtistId) {
        // Update existing artist
        result = await updateArtist(selectedArtistId, {
          ...values,
          userId,
        });

        if (result.success) {
          toast({
            title: t("updateSuccess.title"),
            description: t("updateSuccess.description", { name: values.name }),
            variant: "default",
          });
          router.refresh();
        } else {
          toast({
            title: t("error"),
            description: result.error || t("updateError"),
            variant: "destructive",
          });
        }
      } else {
        // Create new artist
        result = await createArtist({
          ...values,
          userId,
        });

        if (result.success) {
          toast({
            title: t("createSuccess.title"),
            description: t("createSuccess.description", { name: values.name }),
            variant: "default",
          });

          // Redirect to the artists dashboard
          router.push("/dashboard/artists");
          router.refresh();
        } else {
          toast({
            title: t("error"),
            description: result.error || t("createError"),
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: t("error"),
        description: t("formProcessingError"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting an artist
  const handleDeleteArtist = async () => {
    if (!selectedArtistId) return;

    try {
      setIsSubmitting(true);

      const result = await deleteArtist(selectedArtistId);

      if (result.success) {
        toast({
          title: t("deleteSuccess.title"),
          description: t("deleteSuccess.description"),
          variant: "default",
        });

        // Redirect to the artists dashboard
        router.push("/dashboard/artists");
        router.refresh();
      } else {
        toast({
          title: t("error"),
          description: result.error || t("deleteError"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting artist:", error);
      toast({
        title: t("error"),
        description: t("deleteError"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
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
    <div className="space-y-8">
      {/* Artist Selector */}
      {userArtists.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">{t("existingArtists")}</Label>
                <Button type="button" variant="outline" onClick={() => setSelectedArtistId(null)}>
                  {t("createNew")}
                </Button>
              </div>
              <Select
                value={selectedArtistId || ""}
                onValueChange={(value) => setSelectedArtistId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectArtistToEdit")} />
                </SelectTrigger>
                <SelectContent>
                  {userArtists.map((artist) => (
                    <SelectItem key={artist.id} value={artist.id}>
                      {artist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedArtistId && (
                <div className="flex justify-end">
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("deleteArtist")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteConfirmation.title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("deleteConfirmation.description")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{common("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteArtist}>
                          {common("delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Artist Form */}
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
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("namePlaceholder")} />
                      </FormControl>
                      <FormDescription>{t("nameDescription")}</FormDescription>
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
                        <Input {...field} placeholder={t("originPlaceholder")} />
                      </FormControl>
                      <FormDescription>{t("originDescription")}</FormDescription>
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
                        <Textarea {...field} placeholder={t("bioPlaceholder")} rows={6} />
                      </FormControl>
                      <FormDescription>{t("bioDescription")}</FormDescription>
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
                          placeholder={t("newGenrePlaceholder")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddGenre();
                            }
                          }}
                        />
                        <Button type="button" onClick={handleAddGenre}>
                          {t("addGenre")}
                        </Button>
                      </div>
                      <FormDescription>{t("genresDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Social Media */}
                <div className="space-y-4">
                  <Label className="text-base">{t("socialMedia.title")}</Label>
                  <p className="text-muted-foreground text-sm">{t("socialMedia.description")}</p>

                  <FormField
                    control={form.control}
                    name="socialMedia.instagram"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <div className="w-24">
                            <FormLabel>{t("socialMedia.instagram")}</FormLabel>
                          </div>
                          <FormControl>
                            <Input {...field} placeholder={t("socialMedia.instagramPlaceholder")} />
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
                            <FormLabel>{t("socialMedia.spotify")}</FormLabel>
                          </div>
                          <FormControl>
                            <Input {...field} placeholder={t("socialMedia.spotifyPlaceholder")} />
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
                            <FormLabel>{t("socialMedia.youtube")}</FormLabel>
                          </div>
                          <FormControl>
                            <Input {...field} placeholder={t("socialMedia.youtubePlaceholder")} />
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
                            <FormLabel>{t("socialMedia.website")}</FormLabel>
                          </div>
                          <FormControl>
                            <Input {...field} placeholder={t("socialMedia.websitePlaceholder")} />
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
                            <FormLabel>{t("socialMedia.tiktok")}</FormLabel>
                          </div>
                          <FormControl>
                            <Input {...field} placeholder={t("socialMedia.tiktokPlaceholder")} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                {/* Images - Only render if Cloudinary is properly configured */}
                {cloudinaryReady && (
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("images.title")}</FormLabel>
                        <FormControl>
                          <CloudinaryUpload
                            value={field.value || []}
                            onChange={(url, alt, public_id) => {
                              const newImages = [...(field.value || [])];
                              newImages.push({ url, alt: alt || "", public_id });
                              field.onChange(newImages);
                            }}
                            onRemove={(url) => {
                              const newImages = [...(field.value || [])];
                              const indexToRemove = newImages.findIndex((img) => img.url === url);

                              // Adjust profile image index if needed
                              if (profileImageIndex === indexToRemove) {
                                setProfileImageIndex(-1);
                              } else if (profileImageIndex > indexToRemove) {
                                setProfileImageIndex(profileImageIndex - 1);
                              }

                              newImages.splice(indexToRemove, 1);
                              field.onChange(newImages);
                            }}
                            maxImages={5}
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                            isProfileSelector={true}
                            onProfileSelect={setProfileImageIndex}
                            profileImageIndex={profileImageIndex}
                          />
                        </FormControl>
                        <FormDescription>{t("images.description")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? selectedArtistId
                  ? t("updating")
                  : t("creating")
                : selectedArtistId
                  ? t("updateArtist")
                  : t("addArtist")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
