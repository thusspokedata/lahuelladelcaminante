import { getAllEvents } from "@/services/events";
import { HomeClient } from "@/components/HomeClient";

export default async function Home({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const events = await getAllEvents();
  return <HomeClient events={events} locale={locale} />;
}
