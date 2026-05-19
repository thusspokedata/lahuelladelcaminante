/**
 * FormSelect — `<select>` HTML nativo estilizado con tokens.
 *
 * **Decisión explícita del spec**: NO usar shadcn Select. Razones:
 *  - shadcn Select requiere context provider + radix dependencies
 *    pesadas para casos donde un `<select>` nativo alcanza.
 *  - El `<select>` nativo tiene a11y / mobile UX consistente sin
 *    custom code.
 *
 * Si en algún momento necesitamos features (búsqueda, multiselect),
 * crear un componente separado `FormSearchSelect` en lugar de
 * inflar este. Mantener este como leaf simple.
 *
 * El chevron del select queda al estilo del browser por simplicidad.
 * Si en QA queda visualmente fuera del sistema, swap a un wrapper
 * con `appearance-none` + chevron SVG custom.
 *
 * `forwardRef` para react-hook-form. Options se pasan como children
 * (`<option>` elements) o como children-builder, igual que el `<select>`
 * nativo.
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type FormSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full rounded-m bg-bg-surface-2 px-l py-s",
          "border border-border text-body text-fg-primary",
          "transition-colors outline-none cursor-pointer",
          "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
          "aria-[invalid=true]:border-status-danger aria-[invalid=true]:ring-status-danger/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)

export default FormSelect
