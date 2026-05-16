/**
 * StepTimeline — timeline vertical reusable de N estados con indicadores
 * visuales (done / active / todo) y conectores entre items.
 *
 * Estados visuales:
 *  - `done`: círculo lleno verde (`bg-status-ok`) con check ✓. Pasos
 *    completados.
 *  - `active`: círculo lleno dorado (`bg-editorial`) con glow vía
 *    `box-shadow`. El paso "en proceso ahora". Solo uno debe estar
 *    activo a la vez para no confundir la jerarquía visual.
 *  - `todo`: círculo vacío con borde neutro. Pasos futuros.
 *
 * Conector vertical: línea entre items con `border-l` del color del paso
 * anterior (verde si done, neutral si todo). Skip en el último item.
 *
 * Server component — sin estado interno. El caller pasa el array de
 * steps con sus estados ya resueltos.
 *
 * Hoy se consume desde `ApplySubmittedScreen`. Si en el futuro aparece
 * en el dashboard del creator pre-aprobación, reusar acá — no duplicar.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT_v2.md` §1.3 + §3.1.
 */

import { cn } from "@/lib/utils"

export type StepState = "done" | "active" | "todo"

export interface TimelineStep {
  /** Estado visual del paso. */
  state: StepState
  /** Título principal del paso (ej. "Recibida", "En revisión"). */
  label: string
  /** Sub-texto descriptivo (ej. "Hace un momento", "Un humano mira tu perfil"). */
  sublabel: string
  /** Timestamp o duración estimada (ej. "15 may · 14:32", "~ 1-2 días"). */
  when: string
}

export interface StepTimelineProps {
  steps: TimelineStep[]
  /** Label opcional del eyebrow arriba del timeline (ej. "QUÉ SIGUE"). */
  title?: string
  className?: string
}

/** Mapeo de estado → clases del dot indicador. El `active` lleva
 * `shadow-[...]` con CSS var del editorial para que el glow respete el
 * theming si se cambia el accent dorado a futuro. */
const DOT_CLASSES: Record<StepState, string> = {
  done: "bg-status-ok text-on-brand",
  active:
    "bg-editorial text-on-editorial shadow-[0_0_16px_var(--color-editorial)]",
  todo: "bg-transparent border border-border-hi text-fg-tertiary",
}

const CONNECTOR_CLASSES: Record<StepState, string> = {
  done: "bg-status-ok",
  active: "bg-editorial/40",
  todo: "bg-border",
}

function StepDot({ state }: { state: StepState }) {
  return (
    <span
      aria-hidden={true}
      className={cn(
        "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-body-s font-bold leading-none",
        DOT_CLASSES[state]
      )}
    >
      {state === "done" ? "✓" : state === "active" ? "●" : "○"}
    </span>
  )
}

export default function StepTimeline({
  steps,
  title,
  className,
}: StepTimelineProps) {
  return (
    <div className={cn("flex flex-col gap-m", className)}>
      {title ? (
        <p className="font-mono text-eyebrow uppercase text-fg-secondary">
          {title}
        </p>
      ) : null}

      <ol className="flex flex-col">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          return (
            <li
              key={index}
              className="relative grid grid-cols-[auto_1fr] gap-m pb-l last:pb-0"
              aria-current={step.state === "active" ? "step" : undefined}
            >
              {/* Connector vertical: línea desde el centro del dot hasta el
                  siguiente item. Skip en el último. Posicionada absoluta
                  para no afectar el flow del grid. */}
              {!isLast ? (
                <span
                  aria-hidden={true}
                  className={cn(
                    "absolute left-[11px] top-6 bottom-0 w-px",
                    CONNECTOR_CLASSES[step.state]
                  )}
                />
              ) : null}

              <StepDot state={step.state} />

              <div className="flex flex-col gap-xs pt-[2px]">
                <div className="flex flex-wrap items-baseline justify-between gap-s">
                  <p
                    className={cn(
                      "text-body font-semibold leading-tight",
                      step.state === "active"
                        ? "text-fg-primary"
                        : step.state === "done"
                          ? "text-fg-primary"
                          : "text-fg-secondary"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="font-mono text-caption uppercase text-fg-tertiary">
                    {step.when}
                  </p>
                </div>
                <p className="text-body-s leading-relaxed text-fg-secondary">
                  {step.sublabel}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
