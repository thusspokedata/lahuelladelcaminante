/**
 * FormError — texto chico de error inline en sangre.
 *
 * Pensado para ir debajo de un input del form. `FormField` ya lo consume
 * internamente cuando recibe `error`, pero también queda disponible
 * standalone para casos custom (ej. error a nivel form, no a nivel field).
 *
 * `role="alert"` para que screen readers anuncien el error apenas
 * aparece (sin esto, el cambio del DOM puede pasar inadvertido).
 *
 * Server-compat, sin estado.
 */

import { cn } from "@/lib/utils"

export interface FormErrorProps {
  id?: string
  children: React.ReactNode
  className?: string
}

export default function FormError({ id, children, className }: FormErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className={cn("text-body-s text-status-danger", className)}
    >
      {children}
    </p>
  )
}
