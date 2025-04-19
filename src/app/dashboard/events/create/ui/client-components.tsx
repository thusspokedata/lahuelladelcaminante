"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import EventForm, { EventFormValues } from "./EventForm";
import { createEvent } from "../actions";

export function EventFormContainerClient() {
  const router = useRouter();

  const handleSubmit = async (values: EventFormValues) => {
    await createEvent(values);
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
