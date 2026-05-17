"use client"

/**
 * FormField — wrapper de un campo del form: label + slot del input +
 * mensaje (helper o error).
 *
 * Patrón "slot-as-children": el caller pasa el `<FormInput>` /
 * `<FormTextarea>` / `<FormSelect>` como children con sus propias
 * props. Este wrapper se encarga de:
 *  - Label arriba con estilo eyebrow (mono uppercase tracking).
 *  - Asterisco sangre si `required` + texto sr-only i18n para SR users.
 *  - Helper text gris debajo (si no hay error).
 *  - `<FormError>` debajo si hay error.
 *
 * IDs derivados del `name` para asociar label ↔ input ↔ error/helper:
 *  - `htmlFor` del label apunta al input cuyo `id` el caller debe
 *    setear como `name`.
 *  - El input debe llevar `aria-invalid` y `aria-describedby` apuntando
 *    a `{name}-error` o `{name}-helper` — los IDs los expone este
 *    componente para que el caller los referencie.
 *
 * Client component porque consume `useTranslations` para el texto
 * sr-only del required hint ("(requerido)" / "(required)" /
 * "(erforderlich)"). Como todos los callers ya son client components
 * (los forms usan react-hook-form), el upgrade no cambia el árbol
 * runtime.
 *
 * Spec: PR #24 "Rediseño de forms internos".
 */

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import FormError from "./FormError"

export interface FormFieldProps {
  label: string
  /** Usado para `htmlFor` del label e IDs derivados de helper/error.
   * Debe coincidir con el `id`/`name` del input dentro de `children`. */
  name: string
  required?: boolean
  helper?: string
  error?: string
  children: React.ReactNode
  className?: string
}

export default function FormField({
  label,
  name,
  required,
  helper,
  error,
  children,
  className,
}: FormFieldProps) {
  const t = useTranslations("forms")
  const helperId = `${name}-helper`
  const errorId = `${name}-error`

  return (
    <div className={cn("flex flex-col gap-xs", className)}>
      <label
        htmlFor={name}
        className="font-mono text-eyebrow uppercase text-fg-secondary leading-tight"
      >
        {label}
        {required ? (
          <span
            aria-hidden={true}
            className="ml-1 text-brand"
          >
            *
          </span>
        ) : null}
        {required ? (
          <span className="sr-only"> {t("required")}</span>
        ) : null}
      </label>

      {children}

      {error ? (
        <FormError id={errorId}>{error}</FormError>
      ) : helper ? (
        <p id={helperId} className="text-caption text-fg-tertiary">
          {helper}
        </p>
      ) : null}
    </div>
  )
}
