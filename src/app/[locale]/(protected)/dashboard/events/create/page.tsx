import { requireRole } from "@/services/auth"
import { EventForm } from "@/components/events/EventForm"

export default async function CreateEventPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireRole("ARTIST", locale)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Crear Evento</h1>
      <EventForm />
    </div>
  )
}
