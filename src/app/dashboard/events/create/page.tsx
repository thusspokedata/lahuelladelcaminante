"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserStore, useCanCreateEvents } from "@/stores/userStore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CloudinaryUpload, { ImageObject } from "@/components/ui/cloudinary-upload";

// Validation schema for event creation form
const formSchema = z.object({
  title: z.string().min(3, {
    message: "El título debe tener al menos 3 caracteres",
  }),
  description: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres",
  }),
  dates: z.array(z.date()).min(1, {
    message: "Selecciona al menos una fecha",
  }),
  location: z.string().min(3, {
    message: "La ubicación debe tener al menos 3 caracteres",
  }),
  time: z.string().min(1, {
    message: "Indica la hora del evento",
  }),
  price: z.string().optional(),
  genre: z.string().min(1, {
    message: "Selecciona un género",
  }),
  organizerName: z.string().min(3, {
    message: "El nombre del organizador debe tener al menos 3 caracteres",
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

// Type for the form
type FormValues = z.infer<typeof formSchema>;

export default function CreateEventPage() {
  const router = useRouter();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataLoadedRef = useRef(false);

  // Get user state from Zustand store
  const user = useUserStore();
  const canCreateEvents = useCanCreateEvents();

  // Direct Clerk authentication check
  const { isLoaded, isSignedIn, userId } = useAuth();

  // Load user data when component mounts
  useEffect(() => {
    // Prevent multiple data loads
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;

    // Load user data
    user.loadUserData().catch((err) => {
      console.error("Error loading user data:", err);
    });
  }, [isLoaded, isSignedIn, userId, user]);

  // Initialize form with React Hook Form and Zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      dates: [],
      location: "",
      time: "",
      price: "",
      genre: "",
      organizerName: "",
      images: [],
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<FormValues> = async (_values) => {
    // Check if user can create events before submitting
    if (!canCreateEvents) {
      setError("No tienes permiso para crear eventos. Tu cuenta debe estar activa.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // Get form values directly, including images
      const formValues = form.getValues();
      const images = form.getValues("images") || [];

      // Create independent copy of images to avoid reference issues
      const imagesCopy = JSON.parse(JSON.stringify(images));

      // Prepare data to send
      const dataToSend = {
        title: formValues.title,
        description: formValues.description,
        dates: formValues.dates,
        location: formValues.location,
        time: formValues.time,
        price: formValues.price ? parseFloat(formValues.price) : undefined,
        genre: formValues.genre,
        organizerName: formValues.organizerName,
        images: imagesCopy.map((img: ImageObject) => ({
          url: img.url,
          alt: img.alt || "Event image",
          public_id: img.public_id || undefined,
        })),
      };

      // Log image data for debug purposes
      if (dataToSend.images.length > 0) {
        console.log(`Sending ${dataToSend.images.length} images`);
      }

      // Send data to the server
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el evento");
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Error al crear el evento:", error);
      setError(error instanceof Error ? error.message : "Ocurrió un error al crear el evento");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Check if the date is already selected
    const dateExists = selectedDates.some((d) => d.toDateString() === date.toDateString());

    if (dateExists) {
      // Remove the date if already selected
      const newDates = selectedDates.filter((d) => d.toDateString() !== date.toDateString());
      setSelectedDates(newDates);
      form.setValue("dates", newDates);
    } else {
      // Add the date if not selected
      const newDates = [...selectedDates, date];
      setSelectedDates(newDates);
      form.setValue("dates", newDates);
    }
  };

  // If user is not authenticated, show login message
  if (!user.isAuthenticated) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No autorizado</AlertTitle>
          <AlertDescription>
            Debes iniciar sesión para crear eventos.
            <div className="mt-4">
              <Button onClick={() => router.push("/sign-in")}>Iniciar sesión</Button>
              {isSignedIn && userId && (
                <Button
                  variant="outline"
                  className="ml-4"
                  onClick={() => router.push("/dashboard")}
                >
                  Volver al dashboard
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If user is authenticated but not active, show activation message
  if (user.isAuthenticated && !canCreateEvents) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cuenta no activada</AlertTitle>
          <AlertDescription>
            Tu cuenta debe estar activa para crear eventos. Por favor, contacta con un
            administrador.
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Volver al dashboard
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Crear Nuevo Evento</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información del Evento</CardTitle>
          <CardDescription>
            Completa el formulario con los datos del evento que deseas crear.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Event title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Tango en Berlín" {...field} />
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
                      <FormLabel>Organizador</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del organizador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el evento, incluye detalles importantes..."
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
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input placeholder="Café Buenos Aires, Berlín" {...field} />
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
                      <FormLabel>Hora</FormLabel>
                      <FormControl>
                        <Input placeholder="20:00" {...field} />
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
                      <FormLabel>Precio (€)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="15" {...field} />
                      </FormControl>
                      <FormDescription>Deja en blanco si es gratis</FormDescription>
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
                      <FormLabel>Género</FormLabel>
                      <FormControl>
                        <Input placeholder="Tango, Folklore, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dates */}
              <FormField
                control={form.control}
                name="dates"
                render={() => (
                  <FormItem>
                    <FormLabel>Fechas</FormLabel>
                    <div className="space-y-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDates.length && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDates.length
                              ? `${selectedDates.length} fecha${
                                  selectedDates.length > 1 ? "s" : ""
                                } seleccionada${selectedDates.length > 1 ? "s" : ""}`
                              : "Seleccionar fechas"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="multiple"
                            onSelect={(dates) => {
                              if (Array.isArray(dates)) {
                                setSelectedDates(dates);
                                form.setValue("dates", dates);
                              } else if (dates) {
                                handleDateSelect(dates);
                              }
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            selected={selectedDates}
                          />
                        </PopoverContent>
                      </Popover>

                      {selectedDates.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <h4 className="text-sm font-medium">Fechas seleccionadas:</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedDates.map((date, index) => (
                              <div
                                key={index}
                                className="bg-muted flex items-center rounded-md px-3 py-1 text-sm"
                              >
                                {format(date, "dd/MM/yyyy")}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Images */}
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imágenes</FormLabel>
                    <FormControl>
                      <CloudinaryUpload
                        value={(field.value as ImageObject[]) || []}
                        disabled={isSubmitting}
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
                          const updatedImages = currentImages.filter(
                            (img: ImageObject) => img.url !== url
                          );

                          // Update form field
                          field.onChange(updatedImages);
                          form.setValue("images", updatedImages, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                      />
                    </FormControl>
                    <FormDescription>Sube hasta 5 imágenes para tu evento.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creando evento..." : "Crear Evento"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
