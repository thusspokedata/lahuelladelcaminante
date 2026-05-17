/**
 * FormCheckbox — `<input type="checkbox">` + label, estilizado con tokens.
 *
 * El checkbox nativo no se puede estilar uniformemente cross-browser, así
 * que usamos `appearance-none` + Tailwind `accent-brand` como fallback
 * (browsers modernos respetan `accent-color` para el check). Para el caso
 * de no-soporte, el check sale del color default del browser sobre la
 * background del checkbox — funcional aunque no perfecto.
 *
 * El label envuelve al input para que click en cualquier parte del
 * componente toggle el state (UX estándar).
 *
 * `forwardRef` para react-hook-form. El `label` viene como prop, NO
 * por children — esto deja al caller libre de pasar contenido
 * adicional como children (ej. links inline) si lo necesitara.
 *
 * Para el caso especial de checkbox con rich-text label (ej. "Acepto los
 * <terms>términos</terms>" del sign-up), usar el `<input>` inline en el
 * caller en lugar de este componente — la rich-text requiere wrapper
 * personalizado.
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string
}

const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  function FormCheckbox({ className, label, id, ...props }, ref) {
    // El `<label>` envolvente asocia el click implícitamente, pero
    // `htmlFor`/`id` explícitos hacen la asociación tools-friendly
    // (testing-library `getByLabelText`, screen readers que prefieren
    // la asociación explícita, etc.). Si el caller no pasa `id`,
    // generamos uno estable con `useId()`.
    const fallbackId = React.useId()
    const inputId = id ?? fallbackId

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "flex items-start gap-s cursor-pointer select-none",
          "text-body-s text-fg-secondary leading-relaxed",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={cn(
            "mt-[3px] h-4 w-4 shrink-0 rounded-sm",
            "border border-border-hi bg-bg-surface-2",
            "accent-brand cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            "disabled:cursor-not-allowed"
          )}
          {...props}
        />
        <span>{label}</span>
      </label>
    )
  }
)

export default FormCheckbox
