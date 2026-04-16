import Link from "next/link"
import Image from "next/image"
import { useLocale } from "next-intl"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { EventSummary } from "@/services/events"

interface EventCardProps {
  event: EventSummary
}

export function EventCard({ event }: EventCardProps) {
  const locale = useLocale()
  const nextDate = event.dates[0]

  return (
    <Link href={`/${locale}/events/${event.slug}`}>
      <Card className="hover:shadow-md transition-shadow overflow-hidden h-full">
        {event.coverImage && (
          <div className="relative h-48 w-full">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
          {event.genre && <Badge variant="secondary">{event.genre}</Badge>}
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          {nextDate && <p>{formatDate(nextDate, locale)}</p>}
          <p>{event.location}</p>
          {event.artistName && <p className="font-medium text-foreground">{event.artistName}</p>}
        </CardContent>
      </Card>
    </Link>
  )
}
