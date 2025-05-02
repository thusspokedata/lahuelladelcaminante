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
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { createArtist } from "./actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import CloudinaryUpload from "@/components/ui/cloudinary-upload";

interface CreateArtistFormProps {
  userId: string;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  bio: z.string().min(10, {
    message: "La biografía debe tener al menos 10 caracteres.",
  }),
  origin: z.string().min(2, {
    message: "El origen debe tener al menos 2 caracteres.",
  }),
  genres: z.array(z.string()).min(1, {
    message: "Agrega al menos un género.",
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

export default function CreateArtistForm({ userId }: CreateArtistFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGenre, setNewGenre] = useState("");
  const [profileImageIndex, setProfileImageIndex] = useState<number>(-1);
  const { toast } = useToast();
  const router = useRouter();

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

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      // Si hay una imagen seleccionada como perfil, establecer el profileImageId
      if (profileImageIndex >= 0 && values.images && values.images.length > profileImageIndex) {
        const profileImage = values.images[profileImageIndex];

        // Log para depuración
        console.log("Selected profile image:", profileImage);

        // El profileImageId debe ser el public_id completo de la imagen
        values.profileImageId = profileImage.public_id || null;

        console.log("Setting profileImageId to:", values.profileImageId);
      } else {
        // Si no hay una imagen de perfil seleccionada, establecer a null
        values.profileImageId = null;
        console.log("No profile image selected, setting profileImageId to null");
      }

      const result = await createArtist({
        ...values,
        userId,
      });

      // Log del resultado
      console.log("Create artist result:", result);

      if (result.success) {
        toast({
          title: "Artista creado",
          description: "El artista ha sido creado correctamente.",
        });

        // Redirect to the artist edit page to complete additional information
        router.push(`/dashboard/artists/${result.artistId}/edit`);
      } else {
        toast({
          title: "Error",
          description: result.error || "Hubo un error al crear el artista.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Hubo un error al crear el artista.",
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
                    <FormLabel>Nombre del Artista</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre del artista" />
                    </FormControl>
                    <FormDescription>El nombre público del artista o banda</FormDescription>
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
                    <FormLabel>Origen</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ciudad, País" />
                    </FormControl>
                    <FormDescription>
                      Lugar de origen del artista (ej. Buenos Aires, Argentina)
                    </FormDescription>
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
                    <FormLabel>Biografía</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Escribe una biografía del artista..."
                        rows={6}
                      />
                    </FormControl>
                    <FormDescription>
                      Una descripción sobre el artista, su trayectoria y estilo.
                    </FormDescription>
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
                    <FormLabel>Géneros</FormLabel>
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
                        placeholder="Nuevo género"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddGenre();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddGenre}>
                        Agregar
                      </Button>
                    </div>
                    <FormDescription>Agrega los géneros musicales del artista.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Social Media */}
              <div className="space-y-4">
                <FormLabel>Redes Sociales</FormLabel>
                <FormDescription>
                  Agrega enlaces a las redes sociales del artista (opcional).
                </FormDescription>

                <FormField
                  control={form.control}
                  name="socialMedia.instagram"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <div className="w-24">
                          <FormLabel>Instagram</FormLabel>
                        </div>
                        <FormControl>
                          <Input {...field} placeholder="https://instagram.com/artista" />
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
                          <FormLabel>Spotify</FormLabel>
                        </div>
                        <FormControl>
                          <Input {...field} placeholder="https://open.spotify.com/artist/..." />
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
                          <FormLabel>YouTube</FormLabel>
                        </div>
                        <FormControl>
                          <Input {...field} placeholder="https://youtube.com/c/..." />
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
                          <FormLabel>Sitio Web</FormLabel>
                        </div>
                        <FormControl>
                          <Input {...field} placeholder="https://artista.com" />
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
                          <FormLabel>TikTok</FormLabel>
                        </div>
                        <FormControl>
                          <Input {...field} placeholder="https://tiktok.com/@artista" />
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
                    <FormLabel>Imágenes</FormLabel>
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
                    <FormDescription>
                      Agrega hasta 5 imágenes del artista. Selecciona una imagen como perfil.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Agregar Artista"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
