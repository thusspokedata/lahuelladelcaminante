import { getUpcomingEvents } from "@/services/events";
import { getAllArtists } from "@/services/artists";
import { HomeClient } from "@/components/HomeClient";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const upcomingEvents = await getUpcomingEvents();
  const artists = await getAllArtists();
  
  return <HomeClient events={upcomingEvents} artists={artists} locale={locale} />;
}
