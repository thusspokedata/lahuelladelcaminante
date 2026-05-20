/**
 * OnboardingChecklist — los 3 StepCards del primer ingreso al dashboard del
 * creator: (1) crear el primer artista, (2) publicar evento, (3) compartir
 * link. Recibe el estado de cada paso (`hasArtist`, `hasEvent`) y resuelve
 * los textos vía i18n.
 *
 * Nota de naming: el paso 1 da de alta una entidad `Artist` (el músico /
 * banda que el creator presenta), NO el perfil del creator mismo. El
 * `profile` en `labels`/`hrefs` es un nombre de slot legacy — el copy
 * visible ya dice "artista". (Renombrar el slot tocaría el caller; queda
 * fuera del scope "solo copy" de este fix.)
 *
 * Estados de cada paso:
 *  - Pendiente: card en su estado completo (eyebrow número + título + descr.
 *    + CTA).
 *  - Hecho ✓: card atenuada (opacity), label cambia a "01 — Hecho", sin CTA.
 *
 * El step 3 (share) se considera siempre pendiente hasta que se hagan los
 * dos primeros — cuando los 3 están hechos el caller no debería renderizar
 * el checklist (sigue siendo onboarding solo si falta algo).
 *
 * Server component — recibe i18n via prop `t` (function de `getTranslations`)
 * para no encadenar otra await por componente; el caller ya tiene el `t`
 * resuelto.
 */

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import Eyebrow from "@/components/ui/Eyebrow"

export interface OnboardingChecklistProps {
  hasArtist: boolean
  hasEvent: boolean
  /** Traducciones del namespace `dashboard.steps`. */
  labels: {
    pending: string
    done: string
    profile: { title: string; body: string; cta: string }
    event: { title: string; body: string; cta: string }
    share: { title: string; body: string; cta: string }
  }
  /** Hrefs locale-aware ya construidas. El caller decide qué slugs usa. */
  hrefs: {
    profile: string
    event: string
    share: string
  }
}

interface StepProps {
  number: number
  title: string
  body: string
  cta: { label: string; href: string }
  done: boolean
  labels: { pending: string; done: string }
}

function Step({ number, title, body, cta, done, labels }: StepProps) {
  const numberLabel = String(number).padStart(2, "0")
  const stateLabel = done ? labels.done : labels.pending

  return (
    <article
      className={cn(
        "flex flex-col gap-m rounded-l border border-border bg-bg-surface p-l",
        "transition-colors hover:border-border-hi",
        done && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between">
        <Eyebrow accent="creator">{numberLabel}</Eyebrow>
        <span
          className={cn(
            "text-eyebrow font-mono uppercase",
            done ? "text-status-ok" : "text-fg-tertiary"
          )}
        >
          {done ? `${stateLabel} ✓` : stateLabel}
        </span>
      </div>

      <h3 className="text-heading-s font-display text-fg-primary">{title}</h3>

      <p className="text-body-s text-fg-secondary leading-relaxed">{body}</p>

      {!done ? (
        <Link
          href={cta.href}
          className={cn(
            "mt-auto inline-flex items-center gap-xs text-body-s font-semibold text-creator",
            "hover:text-creator/80 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-creator",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page rounded-xs"
          )}
        >
          {cta.label}
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </article>
  )
}

export default function OnboardingChecklist({
  hasArtist,
  hasEvent,
  labels,
  hrefs,
}: OnboardingChecklistProps) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-l">
      <li>
        <Step
          number={1}
          title={labels.profile.title}
          body={labels.profile.body}
          cta={{ label: labels.profile.cta, href: hrefs.profile }}
          done={hasArtist}
          labels={{ pending: labels.pending, done: labels.done }}
        />
      </li>
      <li>
        <Step
          number={2}
          title={labels.event.title}
          body={labels.event.body}
          cta={{ label: labels.event.cta, href: hrefs.event }}
          done={hasEvent}
          labels={{ pending: labels.pending, done: labels.done }}
        />
      </li>
      <li>
        <Step
          number={3}
          title={labels.share.title}
          body={labels.share.body}
          cta={{ label: labels.share.cta, href: hrefs.share }}
          done={false}
          labels={{ pending: labels.pending, done: labels.done }}
        />
      </li>
    </ul>
  )
}
