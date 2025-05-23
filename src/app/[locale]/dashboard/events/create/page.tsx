import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCurrentUser, hasRole, isActiveUser } from "@/services/auth";
import { EventFormContainerClient, BackButtonClient } from "./ui/client-components";
import { getTranslations } from "next-intl/server";

type SearchParams = Promise<{ eventId?: string }>;

export default async function EventPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("events.create");

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
    return (
      <div className="container mx-auto max-w-md py-10">
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("inactiveUser")}</AlertTitle>
          <AlertDescription>{t("inactiveUserMessage")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get eventId from searchParams if it exists
  const { eventId } = await searchParams;
  const isEditMode = Boolean(eventId);

  // If all checks pass, show the event form
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isEditMode ? t("editTitle") : t("title")}</h1>
        <BackButtonClient />
      </div>

      <Suspense fallback={<div>{t("loadingForm")}</div>}>
        <EventFormContainerClient eventId={eventId} />
      </Suspense>
    </div>
  );
}
