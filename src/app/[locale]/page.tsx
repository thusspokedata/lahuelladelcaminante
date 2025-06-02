import { getUpcomingEvents } from "@/services/events";
import { HomeClient } from "@/components/HomeClient";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const upcomingEvents = await getUpcomingEvents();
  return <HomeClient events={upcomingEvents} locale={locale} />;
}
