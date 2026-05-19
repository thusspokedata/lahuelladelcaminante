"use client"

/**
 * ApplyForm — form público de aplicación a creator.
 *
 * Rediseñado al sistema visual usando los primitives nuevos
 * (`FormField`, `FormInput`, `FormTextarea`, `FormSection`). Lógica
 * de submit intacta: fetch a `/api/apply`, manejo de error, congela
 * `submittedAt` al éxito y rendea `ApplySubmittedScreen` con timeline.
 *
 * **Sin cambios en campos** (decisión cerrada del spec): solo restyling
 * de los 3 campos existentes (name, email, message). Si en el futuro
 * se agregan campos (projectName, origin, etc.), entran en otra PR con
 * cambio de schema/API/admin.
 *
 * Mantiene `useState` en lugar de migrar a react-hook-form — son 3
 * campos simples y la lógica del submit ya está consolidada. No vale
 * la pena el churn para esta PR (scope: presentación).
 */

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import FormField from "@/components/forms/FormField"
import FormInput from "@/components/forms/FormInput"
import FormTextarea from "@/components/forms/FormTextarea"
import FormSection from "@/components/forms/FormSection"
import ApplySubmittedScreen from "./ApplySubmittedScreen"

export function ApplyForm() {
  const tForm = useTranslations("apply.form")
  const tCommon = useTranslations("common")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  // `submittedAt` reemplaza al booleano `sent` previo (cambiado en PR #22):
  // además de flag de "ya se envió" (truthy/falsy), guarda el instante
  // exacto del submit para mostrarlo en el primer paso del timeline.
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        // Si el server devuelve `error` (típicamente "Validation error" del
        // route handler), preferirlo sobre el genérico. Sin esto el user
        // ve "error inesperado" cuando hay info concreta disponible.
        throw new Error(data?.error ?? tCommon("error"))
      }
      // `new Date()` acá (no en el render condicional) para congelar el
      // timestamp al momento del éxito, no en cada rerender.
      setSubmittedAt(new Date())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("error"))
    } finally {
      setLoading(false)
    }
  }

  if (submittedAt) {
    return <ApplySubmittedScreen submittedAt={submittedAt} />
  }

  return (
    <form
      method="post"
      onSubmit={handleSubmit}
      className="flex flex-col gap-2xl"
      noValidate
    >
      <FormSection
        eyebrow={tForm("section.eyebrow")}
        title={tForm("section.title")}
        description={tForm("section.description")}
      >
        <FormField label={tForm("name")} name="apply-name" required>
          <FormInput
            id="apply-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tForm("namePlaceholder")}
            required
            minLength={2}
            autoComplete="name"
          />
        </FormField>

        <FormField label={tForm("email")} name="apply-email" required>
          <FormInput
            id="apply-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={tForm("emailPlaceholder")}
            required
            autoComplete="email"
          />
        </FormField>

        <FormField
          label={tForm("message")}
          name="apply-message"
          required
          helper={tForm("messageHint")}
        >
          <FormTextarea
            id="apply-message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={tForm("messagePlaceholder")}
            rows={6}
            required
            minLength={10}
          />
        </FormField>
      </FormSection>

      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full bg-brand text-on-brand font-semibold hover:bg-brand-dim disabled:opacity-60"
      >
        {loading ? tForm("submitting") : tForm("submit")}
      </Button>
    </form>
  )
}
