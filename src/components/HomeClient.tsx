"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeEventsCarousel } from "@/components/HomeEventsCarousel";
import { useTranslations } from "use-intl";
import { Event } from "@/services/events";

export function HomeClient({ events, locale }: { events: Event[]; locale: string }) {
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  return (
    <div className="container mx-auto px-4">
      {/* Events carousel */}
      <section className="mb-12">
        <HomeEventsCarousel events={events} />
      </section>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <Card className="flex min-h-[200px] flex-col">
          <CardHeader>
            <CardTitle>{tHome("upcomingEvents")}</CardTitle>
            <CardDescription>{tHome("upcomingEventsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href={`/${locale}/events`}>
              <Button className="w-full">{tCommon("viewAll")}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex min-h-[200px] flex-col">
          <CardHeader>
            <CardTitle>{tHome("artists")}</CardTitle>
            <CardDescription>{tHome("artistsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href={`/${locale}/artists`}>
              <Button className="w-full">{tCommon("explore")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
