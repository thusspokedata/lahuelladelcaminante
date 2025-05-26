import { getPastEvents } from "@/services/events";
import { EventsClient } from "../ui";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

export default async function PastEventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Get translations
  const t = await getTranslations({ locale: locale, namespace: "events" });

  // Fetch past events from the database
  const events = await getPastEvents();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="mb-2 text-4xl font-bold">{t("past")}</h1>
          <p className="text-muted-foreground text-xl">
            {t("client.pastEventsMessage")}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/${locale}/events`} className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {t("client.viewUpcomingEvents")}
          </Link>
        </Button>
      </header>

      {/* Pass events to client component */}
      <EventsClient initialEvents={events} />
    </div>
  );
}
