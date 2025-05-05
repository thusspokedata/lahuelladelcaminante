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
import { X, Trash2 } from "lucide-react";
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

interface ArtistFormProps {
  userId: string;
  userArtists?: Artist[];
  initialArtistId?: string;
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

export default function ArtistForm({ userId, userArtists = [], initialArtistId }: ArtistFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGenre, setNewGenre] = useState("");
  const [profileImageIndex, setProfileImageIndex] = useState<number>(-1);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(initialArtistId || null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
            title: "¡Artista actualizado!",
            description: `El perfil de "${values.name}" ha sido actualizado correctamente.`,
            variant: "default",
          });
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: result.error || "Hubo un error al actualizar el artista.",
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
            title: "¡Artista creado!",
            description: `"${values.name}" ha sido agregado correctamente.`,
            variant: "default",
          });

          // Redirect to the artists dashboard
          router.push("/dashboard/artists");
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: result.error || "Hubo un error al crear el artista.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Hubo un error al procesar el formulario.",
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
          title: "¡Artista eliminado!",
          description: "El artista ha sido eliminado correctamente.",
          variant: "default",
        });

        // Redirect to the artists dashboard
        router.push("/dashboard/artists");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Hubo un error al eliminar el artista.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting artist:", error);
      toast({
        title: "Error",
        description: "Hubo un error al eliminar el artista.",
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
                <Label className="text-base">Artistas Existentes</Label>
                <Button type="button" variant="outline" onClick={() => setSelectedArtistId(null)}>
                  Crear Nuevo
                </Button>
              </div>
              <Select
                value={selectedArtistId || ""}
                onValueChange={(value) => setSelectedArtistId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un artista para editar" />
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
                        Eliminar Artista
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente el artista
                          y todos sus datos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteArtist}>Eliminar</AlertDialogAction>
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
                  <Label className="text-base">Redes Sociales</Label>
                  <p className="text-muted-foreground text-sm">
                    Agrega enlaces a las redes sociales del artista (opcional).
                  </p>

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
              {isSubmitting
                ? selectedArtistId
                  ? "Actualizando..."
                  : "Creando..."
                : selectedArtistId
                  ? "Actualizar Artista"
                  : "Agregar Artista"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
