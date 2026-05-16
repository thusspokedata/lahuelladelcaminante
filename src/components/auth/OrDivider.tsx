/**
 * OrDivider — separador horizontal con eyebrow centrado.
 *
 * Usado entre el bloque OAuth y el form email/password de las pantallas
 * de auth (handoff v2 §1.1, §1.2). El eyebrow ("O CON EMAIL") viene del
 * caller via prop `label` para que el texto sea i18n-aware (el componente
 * mismo es presentacional puro, no consume `useTranslations`).
 *
 * Implementación: dos `<hr>` flexibles + un `<span>` central. `role="separator"`
 * implícito por `<hr>`. El span del label tiene `aria-hidden={true}` porque
 * el separador en sí mismo ya comunica la división — el texto es solo
 * decoración tipográfica del breakpoint visual.
 */

import { cn } from "@/lib/utils"
import Eyebrow from "@/components/ui/Eyebrow"

export interface OrDividerProps {
  label: string
  className?: string
}

export default function OrDivider({ label, className }: OrDividerProps) {
  return (
    <div
      className={cn("flex items-center gap-m", className)}
      role="presentation"
    >
      <hr className="flex-1 border-t border-border" aria-hidden={true} />
      <Eyebrow as="span" accent="neutral" aria-hidden={true}>
        {label}
      </Eyebrow>
      <hr className="flex-1 border-t border-border" aria-hidden={true} />
    </div>
  )
}
