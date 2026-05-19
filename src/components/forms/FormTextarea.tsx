/**
 * FormTextarea — `<textarea>` estilizado con tokens, hermana de `FormInput`.
 *
 * Misma decisión de no extender `Textarea` shadcn (token mismatch).
 * `min-height` razonable (~6 líneas) — el caller puede override con
 * `rows` o `className`.
 *
 * `forwardRef` para react-hook-form.
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type FormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea({ className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full rounded-m bg-bg-surface-2 px-l py-m",
          "border border-border text-body text-fg-primary leading-relaxed",
          "placeholder:text-fg-tertiary",
          "resize-y",
          "transition-colors outline-none",
          "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
          "aria-[invalid=true]:border-status-danger aria-[invalid=true]:ring-status-danger/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)

export default FormTextarea
