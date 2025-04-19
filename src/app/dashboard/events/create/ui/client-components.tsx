"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import EventForm, { EventFormValues } from "./EventForm";
import { createEventHandler, EventFormData } from "../actions";

export function EventFormContainerClient() {
  const router = useRouter();

  const handleSubmit = async (values: EventFormValues) => {
    // Ensure price is always a string (even if empty)
    const formData: EventFormData = {
      ...values,
      price: values.price || "",
    };

    await createEventHandler(formData);
    router.push("/dashboard");
  };

  return <EventForm onSubmit={handleSubmit} />;
}

export function BackButtonClient() {
  const router = useRouter();

  return (
    <Button variant="outline" onClick={() => router.push("/dashboard")}>
      Volver al dashboard
    </Button>
  );
}
