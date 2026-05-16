"use client"

/**
 * EventRowActions — dropdown de acciones del creator sobre un evento en el
 * listado del dashboard. Reemplaza al `DashboardEventActions` viejo (que
 * solo tenía Borrar inline).
 *
 * Acciones:
 *  - Editar (link a `/dashboard/events/[id]/edit`).
 *  - Compartir link (copia la URL pública del evento al portapapeles).
 *  - Duplicar (TODO — sin server action todavía, item deshabilitado).
 *  - Restaurar (TODO — sin server action todavía, item deshabilitado).
 *  - Borrar (DELETE /api/events/[id] + refresh, con confirmación nativa).
 *
 * Strings vienen del namespace `dashboard.events.row.actions.*`. El locale
 * se necesita para construir las URLs locale-aware y para el `useTranslations`.
 */

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { toast } from "sonner"
import { MoreVertical, Pencil, Share2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface EventRowActionsProps {
  eventId: string
  eventSlug: string
  /** Locale del request — usado solo para el URL público que se copia al
   * portapapeles (queremos que el link compartido lleve al locale del que
   * comparte). `useRouter` de next-intl resuelve el resto. */
  locale: string
}

export default function EventRowActions({
  eventId,
  eventSlug,
  locale,
}: EventRowActionsProps) {
  const t = useTranslations("dashboard.events.row.actions")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  // El edit href va sin prefijo de locale: el router de @/i18n/navigation
  // resuelve el locale activo.
  const editHref = `/dashboard/events/${eventId}/edit`
  // El URL público para compartir SÍ lleva locale, porque se va a pegar en
  // un mensaje externo donde el receptor cae directo a esa página.
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/events/${eventSlug}`
      : ""

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      toast.success(t("shareCopied"))
    } catch {
      toast.error(t("shareFailed"))
    }
    setOpen(false)
  }

  function handleDelete() {
    // Confirmación nativa — suficiente para una acción reversible (soft-delete)
    // sin meter un dialog completo en este PR. El backend marca `isDeleted: true`,
    // no borra hard.
    if (!window.confirm(tCommon("confirmDelete"))) return
    setOpen(false)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          toast.error(err?.error ?? tCommon("deleteError"))
          return
        }
        toast.success(tCommon("eventDeleted"))
        router.refresh()
      } catch {
        toast.error(tCommon("deleteError"))
      }
    })
  }

  function handleEdit() {
    setOpen(false)
    router.push(editHref)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {/* DropdownMenuTrigger del wrapper base-ui renderiza un `<button>` por
          defecto — no usa `asChild`. Estilamos con className directo. */}
      <DropdownMenuTrigger
        aria-label={t("openMenu")}
        disabled={isPending}
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-pill",
          "text-fg-secondary hover:text-fg-primary hover:bg-bg-surface-2",
          "transition-colors focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-creator focus-visible:ring-offset-2",
          "focus-visible:ring-offset-bg-page disabled:opacity-50"
        )}
      >
        <MoreVertical className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
          <Pencil className="w-4 h-4 mr-s" />
          {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
          <Share2 className="w-4 h-4 mr-s" />
          {t("shareLink")}
        </DropdownMenuItem>
        {/* TODO: agregar `Duplicar` y `Restaurar` cuando existan los server
            actions correspondientes. Keys i18n quedan parkeadas en
            `dashboard.events.row.actions.{duplicate,restore}`. */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isPending}
          variant="destructive"
          className="cursor-pointer"
        >
          <Trash2 className="w-4 h-4 mr-s" />
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
