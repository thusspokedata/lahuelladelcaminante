/**
 * FormInput — `<input>` estilizado con tokens del sistema.
 *
 * Reemplaza el `Input` shadcn dentro de los forms internos (apply, event,
 * artist). Diferencias con `src/components/ui/input.tsx`:
 *  - Usa tokens del sistema (`bg-bg-surface-2`, `border-border`,
 *    `border-brand` en focus) en vez de los tokens shadcn neutrales.
 *  - Padding cómodo (`h-10 px-l`) y `rounded-m` consistente con
 *    `FormTextarea` y `FormSelect`.
 *  - `forwardRef` para que `react-hook-form` (`{...register(...)}`)
 *    funcione correctamente.
 *
 * No reemplaza al `Input` shadcn — ese sigue siendo el primitive para
 * forms genéricos del sistema (`/contact`, `/sign-in`, `/sign-up` ya
 * implementados). `FormInput` es para los forms del flow creator que
 * comparten el `FormField` + `FormSection` pattern.
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type FormInputProps = React.InputHTMLAttributes<HTMLInputElement>

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          // Surface + border tokens.
          "h-10 w-full rounded-m bg-bg-surface-2 px-l py-s",
          "border border-border text-body text-fg-primary",
          "placeholder:text-fg-tertiary",
          // Focus: border sangre + ring sutil. Sin shadow para no romper
          // el ritmo visual del form (los CTAs sí llevan shadow).
          "transition-colors outline-none",
          "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
          // Estados de error y disabled. aria-invalid lo setea el caller
          // cuando pasa `error` a `FormField`.
          "aria-[invalid=true]:border-status-danger aria-[invalid=true]:ring-status-danger/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)

export default FormInput
