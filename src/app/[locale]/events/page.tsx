import { getUpcomingEvents } from "@/services/events";
import { EventsClient } from "./ui";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClockIcon } from "lucide-react";

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Get translations
  const t = await getTranslations({ locale: locale, namespace: "events" });

  // Fetch upcoming events from the database
  const events = await getUpcomingEvents();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="mb-2 text-4xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-xl">{t("upcoming")}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/${locale}/events/past`} className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            {t("viewPastEvents")}
          </Link>
        </Button>
      </header>

      {/* Pass events to client component */}
      <EventsClient initialEvents={events} />
    </div>
  );
}
