"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import ApplySubmittedScreen from "./ApplySubmittedScreen"

export function ApplyForm() {
  const t = useTranslations("apply")
  const tCommon = useTranslations("common")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  // `submittedAt` reemplaza al booleano `sent` previo: además de servir
  // como flag de "ya se envió" (truthy / falsy), guarda el instante
  // exacto del submit para mostrarlo en el primer paso del timeline
  // del rediseño (`ApplySubmittedScreen`). El handoff v2 §1.3 pide ese
  // timestamp explícito en el paso "Recibida".
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Error")
      }
      // `new Date()` acá (no en el render condicional) para que el
      // timestamp se congele al momento del éxito, no en cada rerender.
      setSubmittedAt(new Date())
    } catch {
      setError(tCommon("error"))
    } finally {
      setLoading(false)
    }
  }

  if (submittedAt) {
    return <ApplySubmittedScreen submittedAt={submittedAt} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          required
          minLength={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{t("messageLabel")}</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("messagePlaceholder")}
          rows={5}
          required
          minLength={10}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">{t("messageHint")}</p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="w-full font-bold rounded-full h-12 shadow-xl shadow-primary/30"
      >
        {loading ? tCommon("loading") : t("submit")}
      </Button>
    </form>
  )
}
