/**
 * StepCard — card numerada del onboarding del creator. Tres aparecen en fila
 * en desktop (grid 3 cols), apiladas en mobile, en la home del dashboard cuando
 * el creator no tiene contenido todavía.
 *
 * Composición vertical: número en eyebrow ("01"), título, descripción, preview
 * opcional (un mock visual del paso) y CTA opcional al final.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §1.5 + §4.1.
 */

import Link from "next/link"
import { cn } from "@/lib/utils"
import Eyebrow from "@/components/ui/Eyebrow"

export interface StepCardCta {
  label: string
  href: string
}

export interface StepCardProps {
  /** Número del paso (1-based). Se renderiza con dos dígitos ("01", "02"). */
  number: number
  title: string
  description: string
  cta?: StepCardCta
  /** Mock visual del paso (preview). Opcional. */
  preview?: React.ReactNode
  className?: string
}

export default function StepCard({
  number,
  title,
  description,
  cta,
  preview,
  className,
}: StepCardProps) {
  const numberLabel = String(number).padStart(2, "0")

  return (
    <article
      className={cn(
        "flex flex-col gap-m rounded-l border border-border bg-bg-surface p-l",
        "transition-colors hover:border-border-hi",
        className
      )}
    >
      <Eyebrow accent="creator">{numberLabel}</Eyebrow>

      <h3 className="text-heading-s font-display text-fg-primary">{title}</h3>

      <p className="text-body-s text-fg-secondary leading-relaxed">{description}</p>

      {preview ? (
        <div className="mt-s rounded-m bg-bg-surface-2 p-m">{preview}</div>
      ) : null}

      {cta ? (
        <Link
          href={cta.href}
          className={cn(
            "mt-auto inline-flex items-center gap-xs text-body-s font-semibold text-creator",
            "hover:text-creator/80 transition-colors"
          )}
        >
          {cta.label}
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </article>
  )
}
