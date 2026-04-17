"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EventSummary } from "@/services/events"

export default function AdminEventsPage() {
  const t = useTranslations("events")
  const tAdmin = useTranslations("admin")
  const tCommon = useTranslations("common")
  const { locale } = useParams<{ locale: string }>()
  const [events, setEvents] = useState<EventSummary[]>([])

  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((d) => setEvents(d.data ?? []))
  }, [])

  async function softDelete(id: string) {
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success(t("deleteSuccess"))
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } else {
      toast.error(tCommon("error"))
    }
  }

  async function hardDelete(id: string) {
    const res = await fetch(`/api/events/${id}?hard=true`, { method: "DELETE" })
    if (res.ok) {
      toast.success(tAdmin("permanentlyDeleted"))
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } else {
      toast.error(tCommon("error"))
    }
  }

  async function restore(id: string) {
    const res = await fetch(`/api/events/${id}/restore`, { method: "POST" })
    if (res.ok) {
      toast.success(t("restoreSuccess"))
    } else {
      toast.error(tCommon("error"))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{tAdmin("allEvents")}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tAdmin("colTitle")}</TableHead>
            <TableHead>{tAdmin("colGenre")}</TableHead>
            <TableHead>{tAdmin("colArtist")}</TableHead>
            <TableHead>{tAdmin("colActions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium">{event.title}</TableCell>
              <TableCell>{event.genre && <Badge variant="outline">{event.genre}</Badge>}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{event.artistName}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => softDelete(event.id)}>
                    {tCommon("delete")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => restore(event.id)}>
                    {tCommon("restore")}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => hardDelete(event.id)}>
                    {tAdmin("permanentDelete")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
