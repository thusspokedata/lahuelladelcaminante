import { EventsClient } from "@/components/EventsClient";
import { mockEvents } from "@/mockData";

export default function EventsPage() {
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

      {/* Pasamos los eventos al componente cliente */}
      <EventsClient initialEvents={mockEvents} />
    </div>
  );
}
