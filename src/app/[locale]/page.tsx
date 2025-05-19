import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getAllEvents } from "@/services/events";
import { HomeEventsCarousel } from "@/components/HomeEventsCarousel";

export default async function Home() {
  // Get events for the carousel
  const events = await getAllEvents();

  return (
    <div className="container mx-auto px-4">
      {/* Events carousel */}
      <section className="mb-12">
        <HomeEventsCarousel events={events} />
      </section>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <Card className="flex min-h-[200px] flex-col">
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>
              Descubre los próximos shows de música argentina en Berlín
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href="/events">
              <Button className="w-full">Ver Todos</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex min-h-[200px] flex-col">
          <CardHeader>
            <CardTitle>Artistas</CardTitle>
            <CardDescription>Conoce a los artistas argentinos que actúan en Berlín</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href="/artists">
              <Button className="w-full">Explorar Artistas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
