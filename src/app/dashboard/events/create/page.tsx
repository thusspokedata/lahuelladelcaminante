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

// Define types for debug info
interface DebugInfo {
  storeState?: Record<string, unknown>;
  error?: string;
  timestamp: string;
  clerkAuth?: {
    isLoaded?: boolean;
    isSignedIn?: boolean;
    userId?: string | null;
  };
}

interface AuthDebugInfo {
  user?: Record<string, unknown>;
  error?: string;
  session?: Record<string, unknown>;
  [key: string]: unknown;
}

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
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [authDebugInfo, setAuthDebugInfo] = useState<AuthDebugInfo | null>(null);
  // Add a ref to prevent multiple data loads
  const dataLoadedRef = useRef(false);

  // Get user state from Zustand store
  const user = useUserStore();
  const canCreateEvents = useCanCreateEvents();

  // Direct Clerk authentication check
  const { isLoaded, isSignedIn, userId } = useAuth();

  // Load user data when component mounts
  useEffect(() => {
    // Prevent multiple data loads and infinite loops
    if (dataLoadedRef.current) return;

    dataLoadedRef.current = true;
    console.log("Loading user data...");

    // Log direct Clerk auth state
    console.log("Direct Clerk Auth:", { isLoaded, isSignedIn, userId });

    // Attempt to load data and capture for debugging
    user
      .loadUserData()
      .then(() => {
        setDebugInfo({
          storeState: { ...user },
          timestamp: new Date().toISOString(),
          clerkAuth: { isLoaded, isSignedIn, userId },
        });
        console.log("User data loaded successfully");
      })
      .catch((err) => {
        setDebugInfo({
          error: err.message,
          timestamp: new Date().toISOString(),
          clerkAuth: { isLoaded, isSignedIn, userId },
        });
        console.error("Error loading user data:", err);
      });
  }, [isLoaded, isSignedIn, userId]); // Add Clerk auth state dependencies

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
      // Get all form values directly from form to ensure we have the latest
      const formValues = form.getValues();

      // Transform price to number before sending
      const dataToSend = {
        ...formValues,
        price: formValues.price ? parseFloat(formValues.price) : undefined,
      };

      // Verify images before sending
      console.log("IMAGES TO SEND:", JSON.stringify(dataToSend.images, null, 2));

      // Make sure images have the correct structure
      if (
        !dataToSend.images ||
        !Array.isArray(dataToSend.images) ||
        dataToSend.images.length === 0
      ) {
        console.warn("No images to send or incorrect format");
      } else {
        console.log(
          `Sending ${dataToSend.images.length} images with structure:`,
          dataToSend.images[0]
        );
      }

      // Send data to the server with credentials
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important to include credentials for auth
        body: JSON.stringify(dataToSend, (key, value) => {
          // Check any transformations during serialization
          if (key === "images") {
            console.log("Images during serialization:", value);
          }
          return value;
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el evento");
      }

      const eventData = await response.json();
      console.log("Event created:", eventData);
      console.log("Saved images:", eventData.images);

      // Redirect to dashboard after creating the event
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

  // Function to fetch auth debug information
  const fetchAuthDebugInfo = async () => {
    try {
      const response = await fetch("/api/auth-debug", {
        credentials: "include",
      });
      const data = await response.json();
      setAuthDebugInfo(data);
      console.log("Auth debug info:", data);
    } catch (err) {
      console.error("Error fetching auth debug info:", err);
      setAuthDebugInfo({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  };

  // Test event creation API directly
  const testEventAPI = async () => {
    try {
      const testData = {
        title: "Test Event",
        description: "Test Description that is at least 10 characters long",
        dates: [new Date()],
        location: "Test Location",
        time: "12:00",
        price: "10",
        genre: "Test",
        organizerName: "Test Organizer",
        images: [{ url: "https://example.com/test.jpg", alt: "Test Image" }], // Update to use image objects
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      console.log("Event API test result:", result);

      if (!response.ok) {
        setError(`API Test error: ${result.error || "Unknown error"}`);
      } else {
        setError(null);
        alert("API test successful! Event created");
      }
    } catch (err) {
      console.error("Error testing event API:", err);
      setError(`API Test exception: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // If user is not authenticated, show login message with a bypass option for debug
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

              {/* Temporary bypass button if Clerk shows user is authenticated but API doesn't */}
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

        {/* Debug information */}
        <div className="mt-8 overflow-auto rounded border bg-slate-100 p-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="mb-2 font-bold">Información de depuración:</h3>
            <div className="space-x-2">
              <Button size="sm" variant="outline" onClick={fetchAuthDebugInfo}>
                Verificar autenticación
              </Button>
              <Button size="sm" variant="outline" onClick={testEventAPI}>
                Probar API eventos
              </Button>
            </div>
          </div>

          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          <h3 className="mt-4 mb-2 font-bold">Estado del store:</h3>
          <pre>{JSON.stringify(user, null, 2)}</pre>
          <h3 className="mt-4 mb-2 font-bold">Estado de Clerk directo:</h3>
          <pre>{JSON.stringify({ isLoaded, isSignedIn, userId }, null, 2)}</pre>

          {authDebugInfo && (
            <>
              <h3 className="mt-4 mb-2 font-bold">Información de autenticación (API):</h3>
              <pre>{JSON.stringify(authDebugInfo, null, 2)}</pre>
            </>
          )}

          {/* Show a message about authentication mismatch */}
          {isSignedIn && userId && !user.isAuthenticated && (
            <div className="mt-4 rounded border border-yellow-500 bg-yellow-100 p-3 text-yellow-800">
              <strong>Problema detectado:</strong> Estás autenticado en Clerk pero la API no
              reconoce tu sesión. Esto puede suceder por problemas con cookies o por un error en la
              configuración.
              <br />
              <br />
              Por favor, intenta:
              <ul className="mt-2 list-disc pl-5">
                <li>Cerrar sesión y volver a iniciarla</li>
                <li>Borrar cookies del navegador</li>
                <li>Usar una ventana de navegación privada</li>
                <li>Contactar al administrador si el problema persiste</li>
              </ul>
            </div>
          )}
        </div>
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Imágenes</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log("Current images state:", field.value);
                          alert(`${field.value?.length || 0} imágenes en el formulario`);
                        }}
                      >
                        Verificar imágenes
                      </Button>
                    </div>
                    <FormControl>
                      <CloudinaryUpload
                        value={(field.value as ImageObject[]) || []}
                        disabled={isSubmitting}
                        onChange={(url: string, alt?: string, public_id?: string) => {
                          console.log("Image uploaded:", { url, alt, public_id });
                          const newImage: ImageObject = {
                            url,
                            alt: alt || form.getValues().title || "Event image",
                            public_id,
                          };
                          console.log("Adding image:", newImage);

                          const currentImages = Array.isArray(field.value) ? field.value : [];
                          const updatedImages = [...currentImages, newImage];

                          field.onChange(updatedImages);

                          form.setValue("images", updatedImages, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });

                          setTimeout(() => {
                            console.log("Images after adding:", form.getValues().images);
                          }, 100);
                        }}
                        onRemove={(url: string) => {
                          const currentImages = Array.isArray(field.value) ? field.value : [];
                          const updatedImages = currentImages.filter(
                            (img: ImageObject) => img.url !== url
                          );

                          field.onChange(updatedImages);

                          form.setValue("images", updatedImages, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });

                          setTimeout(() => {
                            console.log("Images after removing:", form.getValues().images);
                          }, 100);
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
