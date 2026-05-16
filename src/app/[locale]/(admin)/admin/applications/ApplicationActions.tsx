"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Props {
  id: string
  email: string
  name: string
}

export function ApplicationActions({ id, email, name }: Props) {
  const t = useTranslations("admin")
  const router = useRouter()
  const [loading, setLoading] = useState<"APPROVED" | "REJECTED" | null>(null)

  async function update(status: "APPROVED" | "REJECTED") {
    setLoading(status)
    try {
      await fetch(`/api/apply/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, email, name }),
      })
      toast.success(status === "APPROVED" ? t("applicationsApprovedMsg") : t("applicationsRejectedMsg"))
      router.refresh()
    } catch {
      toast.error("Error")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button
        size="sm"
        variant="outline"
        className="text-red-400 border-red-400/30 hover:bg-red-500/10 hover:text-red-400 rounded-full"
        disabled={!!loading}
        onClick={() => update("REJECTED")}
      >
        {loading === "REJECTED" ? "..." : t("applicationsReject")}
      </Button>
      <Button
        size="sm"
        className="rounded-full bg-green-600 hover:bg-green-500 text-white"
        disabled={!!loading}
        onClick={() => update("APPROVED")}
      >
        {loading === "APPROVED" ? "..." : t("applicationsAccept")}
      </Button>
    </div>
  )
}
