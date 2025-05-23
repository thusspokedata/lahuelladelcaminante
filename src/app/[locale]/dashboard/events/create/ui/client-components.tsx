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
import { useTranslations } from "next-intl";

export function BackButtonClient() {
  const router = useRouter();
  const t = useTranslations("common");

  return (
    <Button variant="outline" onClick={() => router.back()}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {t("back")}
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

  // Get translations
  const t = useTranslations("events.create");
  const tCommon = useTranslations("common");

  // Load event data if in edit mode
  useEffect(() => {
    if (eventId) {
      setIsLoading(true);
      getEventById(eventId)
        .then((data) => {
          setEvent(data);
        })
        .catch((error: Error) => {
          setError(error.message || t("loadError"));
          toast({
            title: tCommon("error"),
            description: error.message || t("loadErrorToast"),
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [eventId, toast, t, tCommon]);

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
          title: eventId ? t("updateSuccess") : t("createSuccess"),
          description: eventId
            ? t("updateSuccessDescription", { title: values.title })
            : t("createSuccessDescription", { title: values.title }),
          variant: "default",
        });

        // Redirect to events list
        router.push("/dashboard/events");
        router.refresh();
      } else {
        setError(t("submitError"));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("submitError");
      setError(errorMessage);
      toast({
        title: tCommon("error"),
        description: errorMessage || t("submitErrorToast"),
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
          title: t("deleteSuccess"),
          description: t("deleteSuccessDescription"),
          variant: "default",
        });

        // Redirect to events list
        router.push("/dashboard/events");
        router.refresh();
      } else {
        throw new Error(t("deleteError"));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("deleteError");
      toast({
        title: tCommon("error"),
        description: errorMessage || t("deleteErrorToast"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return <div>{t("loadingEvent")}</div>;
  }

  return (
    <div className="space-y-8">
      {eventId && (
        <div className="flex justify-end">
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t("deleteEvent")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("deleteConfirmDescription")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{tCommon("delete")}</AlertDialogAction>
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
