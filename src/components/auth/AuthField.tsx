/**
 * AuthField — wrapper consistente para los campos de los forms de auth.
 *
 * Centraliza el patrón Label + slot del input + hint/error en un solo
 * componente. Cada caller (SignInForm, SignUpForm) pasa el `<Input>` ya
 * configurado como `children`; este wrapper se encarga del Label arriba
 * y del mensaje debajo (hint si no hay error, error si lo hay).
 *
 * Accesibilidad:
 *  - `Label` con `htmlFor={id}` para asociación correcta.
 *  - El input slot debe llevar `aria-invalid` cuando hay error y
 *    `aria-describedby={hintId | errorId}` apuntando al `<p>` debajo.
 *    Lo aplica el caller (este wrapper no inyecta props al child) — los
 *    `id`s del hint y error se exponen como constantes en el caller via
 *    `${id}-hint` y `${id}-error`.
 *
 * Server component — no consume hooks ni state. Reusable en cualquier
 * form, no atado a react-hook-form ni a una librería específica.
 */

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export interface AuthFieldProps {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}

export default function AuthField({
  id,
  label,
  hint,
  error,
  children,
  className,
}: AuthFieldProps) {
  return (
    <div className={cn("flex flex-col gap-xs", className)}>
      <Label htmlFor={id} className="text-body-s text-fg-secondary">
        {label}
      </Label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="text-body-s text-status-danger"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-fg-tertiary">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
