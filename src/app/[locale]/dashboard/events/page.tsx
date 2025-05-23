import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Calendar, MapPin, Clock } from "lucide-react";
import { getEventsByUser } from "@/services/events";
import { format } from "date-fns";
import { es, de, enUS } from "date-fns/locale";
import Image from "next/image";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { getTranslations } from "next-intl/server";

export default async function EventsDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const authResult = await auth();
  const userId = authResult.userId;
  const t = await getTranslations("dashboard.events");

  if (!userId) {
    redirect("/sign-in");
  }

  const events = await getEventsByUser(userId);

  // Set date locale based on current language
  const dateLocale =
    {
      es,
      de,
      en: enUS,
    }[locale] || es;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild>
          <Link href={`/${locale}/dashboard/events/create`}>
            <Plus className="mr-2 h-4 w-4" />
            {t("create")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 px-6 md:grid-cols-2 lg:grid-cols-3">
        {events.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center px-8 py-12">
              <p className="text-muted-foreground mb-4 text-center">{t("noEvents")}</p>
              <Button asChild>
                <Link href={`/${locale}/dashboard/events/create`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("create")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => {
            // Get first image as cover, if available
            const coverImage = event.images && event.images.length > 0 ? event.images[0] : null;

            // Format the first date for display
            const formattedDate =
              event.dates && event.dates.length > 0
                ? format(
                    new Date(event.dates[0].date),
                    locale === "es"
                      ? "d 'de' MMMM, yyyy"
                      : locale === "de"
                        ? "d. MMMM yyyy"
                        : "MMMM d, yyyy",
                    { locale: dateLocale }
                  )
                : t("dateNotAvailable");

            return (
              <Card key={event.id} className="overflow-hidden">
                {/* Image section */}
                <div className="relative h-48 w-full">
                  {coverImage ? (
                    <Image
                      src={coverImage.url}
                      alt={coverImage.alt || event.title}
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="bg-muted flex h-full w-full items-center justify-center">
                      <ImagePlaceholder className="text-muted-foreground h-16 w-16" />
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <CardDescription>
                    {event.artist ? event.artist.name : t("noArtist")}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2 pb-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-1 h-4 w-4 opacity-70" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-1 h-4 w-4 opacity-70" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-1 h-4 w-4 opacity-70" />
                    <span>{event.time}</span>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between pt-2">
                  <Button variant="outline" asChild>
                    <Link href={`/${locale}/events/${event.slug}`} target="_blank">
                      {t("viewEvent")}
                    </Link>
                  </Button>
                  <Button variant="default" asChild>
                    <Link href={`/${locale}/dashboard/events/create?eventId=${event.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {t("editEvent")}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
