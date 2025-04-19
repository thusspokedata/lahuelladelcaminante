"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";

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
export type EventFormValues = z.infer<typeof formSchema>;

interface EventFormProps {
  onSubmit: (values: EventFormValues) => Promise<void>;
  isSubmitting?: boolean;
  initialError?: string | null;
}

export default function EventForm({
  onSubmit,
  isSubmitting = false,
  initialError = null,
}: EventFormProps) {
  const [error, setError] = useState<string | null>(initialError);

  // Initialize form with React Hook Form and Zod
  const form = useForm<EventFormValues>({
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
  const handleSubmit: SubmitHandler<EventFormValues> = async (values) => {
    setError(null);
    try {
      await onSubmit(values);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error al crear el evento");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Evento</CardTitle>
        <CardDescription>
          Completa el formulario con los datos del evento que deseas crear.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
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
            <DateSelector form={form} />

            {/* Images */}
            <ImageUploadField form={form} disabled={isSubmitting} />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creando evento..." : "Crear Evento"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
