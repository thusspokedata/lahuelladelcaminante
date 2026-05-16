/**
 * ApplySubmittedScreen — pantalla "Solicitud enviada" del `/apply` flow.
 *
 * El handoff v2 §1.3 trata este touchpoint como el **último del journey
 * de aplicación** y le da peso editorial: no es un "check verde +
 * botón", es la confirmación cálida + roadmap de qué sigue.
 *
 * Layout:
 *  - Desktop: split 1:1 (hero izq, timeline der).
 *  - Mobile: stack vertical (hero → timeline → CTAs → footnote).
 *
 * Renderizado por `ApplyForm` cuando `sent === true` — vive dentro de
 * `/apply` page, no es ruta separada. Esto preserva el state del form
 * sin query params ni cookies y mantiene el routing intacto.
 *
 * El timestamp del "Recibida" viene del prop `submittedAt` (pasado por
 * el caller con `new Date()` al momento del submit). Se formatea según
 * el locale del request.
 *
 * Client component porque (a) usa `useTranslations` / `useLocale` para
 * resolver el copy + formato de fecha según locale activo, y (b) es
 * renderizado desde `ApplyForm` que es client (no cruza boundary).
 * Si en el futuro hay que renderizar este screen desde server, mover
 * el formato + i18n al caller server y pasar los strings ya resueltos.
 *
 * IMPORTANTE: el copy de "En revisión" dice "Un humano mira tu perfil",
 * **NO menciona nombres de admins**. Decisión cerrada del handoff §1.3
 * y §6.6 — el copy debe sobrevivir cambios de equipo y reducir presión
 * personalizada.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT_v2.md` §1.3.
 */

"use client"

import { useTranslations, useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import Eyebrow from "@/components/ui/Eyebrow"
import StepTimeline, {
  type TimelineStep,
} from "@/components/auth/StepTimeline"

export interface ApplySubmittedScreenProps {
  /** Momento del submit del form. Se formatea para mostrarse en el
   * primer paso del timeline ("Recibida"). */
  submittedAt: Date
}

/** Formatea una fecha en el locale dado, formato corto día-mes + hora.
 * Ej. ES `15 may · 14:32` / EN `May 15 · 2:32 PM` / DE `15. Mai · 14:32`.
 * El separador `·` se inserta acá porque `Intl.DateTimeFormat` no lo
 * soporta nativamente — alternativa sería dos `format` calls + join. */
function formatSubmittedAt(date: Date, locale: string): string {
  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(date)
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
  return `${day} · ${time}`
}

export default function ApplySubmittedScreen({
  submittedAt,
}: ApplySubmittedScreenProps) {
  const t = useTranslations("apply.submitted")
  const tTimeline = useTranslations("apply.submitted.timeline")
  const locale = useLocale()

  const formattedDate = formatSubmittedAt(submittedAt, locale)

  // Los 4 estados del timeline. El primero es done (acaba de pasar),
  // el segundo es active (en revisión ahora), los otros dos todo.
  // El copy del paso "reviewing" usa **"Un humano mira tu perfil"** —
  // no menciona nombres de admins (decisión cerrada del handoff §6.6).
  const steps: TimelineStep[] = [
    {
      state: "done",
      label: tTimeline("received"),
      sublabel: tTimeline("receivedSub"),
      when: formattedDate,
    },
    {
      state: "active",
      label: tTimeline("reviewing"),
      sublabel: tTimeline("reviewingSub"),
      when: tTimeline("reviewingWhen"),
    },
    {
      state: "todo",
      label: tTimeline("approval"),
      sublabel: tTimeline("approvalSub"),
      when: tTimeline("approvalWhen"),
    },
    {
      state: "todo",
      label: tTimeline("publishing"),
      sublabel: tTimeline("publishingSub"),
      when: tTimeline("publishingWhen"),
    },
  ]

  return (
    <section
      aria-labelledby="apply-submitted-heading"
      className="grid grid-cols-1 gap-2xl lg:grid-cols-2 lg:gap-3xl"
    >
      {/* Hero izquierdo — eyebrow + título afectivo + body + CTAs. */}
      <div className="flex flex-col gap-l">
        <Eyebrow accent="editorial" as="p">
          {t("badge")}
        </Eyebrow>
        <h1
          id="apply-submitted-heading"
          className="text-display-l font-display leading-tight text-fg-primary"
        >
          {t.rich("title", {
            accent: (chunks) => (
              <span className="text-brand italic">{chunks}</span>
            ),
          })}
        </h1>
        <p className="text-body-l leading-relaxed text-fg-secondary max-w-[44ch]">
          {t("body")}
        </p>

        <div className="mt-s flex flex-wrap items-center gap-s">
          <Button
            asChild
            className="h-11 bg-brand text-on-brand font-semibold hover:bg-brand-dim"
          >
            <Link href="/events">{t("ctaPrimary")}</Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/">{t("ctaSecondary")}</Link>
          </Button>
        </div>
      </div>

      {/* Timeline derecha — surface elevada, padding generoso. */}
      <aside className="rounded-l border border-border bg-bg-surface p-l lg:p-xl">
        <StepTimeline steps={steps} title={tTimeline("title")} />

        <p className="mt-l border-t border-border pt-l text-body-s leading-relaxed text-fg-tertiary">
          {t.rich("instagramHint", {
            ig: (chunks) => (
              <a
                href="https://instagram.com/lahuelladelcaminante"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-fg-secondary underline-offset-4 hover:underline hover:text-fg-primary"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </aside>
    </section>
  )
}
