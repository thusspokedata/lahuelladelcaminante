import { getAllEvents } from "@/services/events";
import { EventsClient } from "./ui";
import { getTranslations } from "next-intl/server";

export default async function EventsPage({ params }: { params: { locale: string } }) {
  // Get translations
  const t = await getTranslations({ locale: params.locale, namespace: "events" });

  // Fetch events from the database
  const events = await getAllEvents();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div>
          <h1 className="mb-2 text-4xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-xl">{t("upcoming")}</p>
        </div>
      </header>

      {/* Pass events to client component */}
      <EventsClient initialEvents={events} />
    </div>
  );
}
