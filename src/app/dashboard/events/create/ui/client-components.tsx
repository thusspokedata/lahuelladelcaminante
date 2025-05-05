"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import EventForm, { EventFormValues } from "./EventForm";
import {
  createEventHandler,
  getEventById,
  updateEventHandler,
  deleteEventHandler,
} from "../actions";
import { ArrowLeft, Trash2 } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";

export function BackButtonClient() {
  const router = useRouter();
  return (
    <Button variant="outline" onClick={() => router.back()}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Volver
    </Button>
  );
}

export function EventFormContainerClient({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [event, setEvent] = useState<EventFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(eventId));
  const { toast } = useToast();

  // Load event data if in edit mode
  useEffect(() => {
    if (eventId) {
      setIsLoading(true);
      getEventById(eventId)
        .then((data) => {
          setEvent(data);
        })
        .catch((error: Error) => {
          setError(error.message || "Error al cargar el evento");
          toast({
            title: "Error",
            description: error.message || "No se pudo cargar el evento",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [eventId, toast]);

  const handleSubmit = async (values: EventFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let result;

      // Ensure price is always a string (even if empty)
      const formData = {
        ...values,
        price: values.price || "",
      };

      if (eventId) {
        // Update existing event
        result = await updateEventHandler(eventId, formData);
      } else {
        // Create new event
        result = await createEventHandler(formData);
      }

      if (result.success) {
        toast({
          title: eventId ? "¡Evento actualizado!" : "¡Evento creado!",
          description: eventId
            ? `El evento "${values.title}" ha sido actualizado correctamente.`
            : `El evento "${values.title}" ha sido creado correctamente.`,
          variant: "default",
        });

        // Redirect to events list
        router.push("/dashboard/events");
        router.refresh();
      } else {
        setError("Ha ocurrido un error");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ha ocurrido un error";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage || "Hubo un error al procesar la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;

    setIsSubmitting(true);
    try {
      const result = await deleteEventHandler(eventId);

      if (result.success) {
        toast({
          title: "¡Evento eliminado!",
          description: "El evento ha sido eliminado correctamente.",
          variant: "default",
        });

        // Redirect to events list
        router.push("/dashboard/events");
        router.refresh();
      } else {
        throw new Error("No se pudo eliminar el evento");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ha ocurrido un error";
      toast({
        title: "Error",
        description: errorMessage || "Hubo un error al eliminar el evento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return <div>Cargando datos del evento...</div>;
  }

  return (
    <div className="space-y-8">
      {eventId && (
        <div className="flex justify-end">
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Evento
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El evento será eliminado de la plataforma.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <EventForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        initialError={error}
        initialData={event}
      />
    </div>
  );
}
