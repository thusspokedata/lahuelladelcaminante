import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCurrentUser, hasRole, isActiveUser } from "@/services/auth";
import { EventFormContainerClient, BackButtonClient } from "./ui/client-components";

type SearchParams = Promise<{ eventId?: string }>;

export default async function EventPage({ searchParams }: { searchParams: SearchParams }) {
  // Auth checks on the server
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user data to check permissions
  await getCurrentUser();

  // Check if user can create events (admin or artist with active status)
  const isAdmin = await hasRole("ADMIN");
  const isActive = await isActiveUser();
  const canCreateEvents = isAdmin || isActive;

  if (!canCreateEvents) {
    return <InactiveUserMessage />;
  }

  // Get eventId from searchParams if it exists
  const { eventId } = await searchParams;
  const isEditMode = Boolean(eventId);

  // If all checks pass, show the event form
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Editar Evento" : "Crear Nuevo Evento"}
        </h1>
        <BackButtonClient />
      </div>

      <Suspense fallback={<div>Cargando formulario...</div>}>
        <EventFormContainerClient eventId={eventId} />
      </Suspense>
    </div>
  );
}

// Server component
function InactiveUserMessage() {
  return (
    <div className="container mx-auto py-10">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Cuenta no activada</AlertTitle>
        <AlertDescription>
          Tu cuenta debe estar activa para crear eventos. Por favor, contacta con un administrador.
          <div className="mt-4">
            <BackButtonClient />
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
