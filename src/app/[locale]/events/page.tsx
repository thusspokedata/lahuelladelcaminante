import { getAllEvents } from "@/services/events";
import { EventsClient } from "./ui";

export default async function EventsPage() {
  // Fetch events from the database
  const events = await getAllEvents();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div>
          <h1 className="mb-2 text-4xl font-bold">Eventos</h1>
          <p className="text-muted-foreground text-xl">
            Próximos shows de música argentina en Berlín
          </p>
        </div>
      </header>

      {/* Pass events to client component */}
      <EventsClient initialEvents={events} />
    </div>
  );
}
