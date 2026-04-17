"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DashboardEventActionsProps {
  eventId: string
  locale: string
}

export function DashboardEventActions({ eventId, locale }: DashboardEventActionsProps) {
  const t = useTranslations("common")
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? t("deleteError"))
        return
      }
      toast.success(t("eventDeleted"))
      router.refresh()
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 rounded-full px-3 py-1">
        <span className="text-xs text-destructive font-medium">{t("confirmDelete")}</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-bold text-destructive hover:underline disabled:opacity-50"
        >
          {loading ? "..." : t("yes")}
        </button>
        <span className="text-destructive/40">·</span>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("no")}
        </button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setConfirming(true)}
      className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2.5"
      title={t("delete")}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  )
}
