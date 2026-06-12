"use client"

/**
 * GenreCombobox — multi-select de géneros con creación al vuelo.
 *
 * Por qué un componente nuevo y no `FormSelect`: el propio `FormSelect`
 * documenta que multiselect/búsqueda van en un componente aparte. Este lo
 * cubre sobre el Combobox de Base UI (chips removibles + lista filtrable +
 * crear).
 *
 * Comportamiento clave (ver spec `2026-06-12-event-multiple-genres`):
 *  - Las sugerencias salen de `suggestions` (base curada ∪ géneros usados),
 *    pasadas desde el server.
 *  - El filtrado es NORMALIZADO (case + acentos vía `normalizeGenre`): tipear
 *    "regae" matchea "Reggae" y NO ofrece "+ crear", suprimiendo duplicados
 *    semánticos.
 *  - La opción "crear «X»" solo aparece cuando lo tipeado no matchea ninguna
 *    sugerencia ni un género ya seleccionado (comparando normalizado).
 *  - El valor del form es `string[]`; este componente es controlado.
 *
 * Sin dependencias nuevas: Base UI ya está en el proyecto.
 */

import * as React from "react"
import { Combobox } from "@base-ui/react/combobox"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { normalizeGenre } from "@/lib/genres"

export interface GenreComboboxProps {
  /** Debe coincidir con el `name` del `FormField` para asociar el label. */
  id?: string
  value: string[]
  onValueChange: (value: string[]) => void
  suggestions: string[]
  placeholder?: string
  /** Label del item "crear" — recibe el texto tipeado, ej. `Crear «{value}»`. */
  createLabel: (value: string) => string
  /** Texto cuando no hay coincidencias ni opción de crear. */
  emptyLabel: string
  /** aria-label del botón de quitar — recibe el género para distinguir cada
   * chip ante un lector de pantalla, ej. `Quitar Tango`. */
  removeLabel: (genre: string) => string
  /** ID del helper text para asociarlo al input vía aria-describedby. */
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

export function GenreCombobox({
  id,
  value,
  onValueChange,
  suggestions,
  placeholder,
  createLabel,
  emptyLabel,
  removeLabel,
  "aria-describedby": ariaDescribedby,
  "aria-invalid": ariaInvalid,
}: GenreComboboxProps) {
  const [inputValue, setInputValue] = React.useState("")

  // El texto a "crear": null si está vacío o si ya existe (normalizado) entre
  // las sugerencias o lo ya seleccionado. Si no, la grafía cruda tipeada.
  const createValue = React.useMemo(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) return null
    const key = normalizeGenre(trimmed)
    const selected = new Set(value.map(normalizeGenre))
    const exists = selected.has(key) || suggestions.some((s) => normalizeGenre(s) === key)
    return exists ? null : trimmed
  }, [inputValue, value, suggestions])

  // Items del dropdown: sugerencias no seleccionadas que matchean (substring
  // normalizado) + la opción de crear al final si corresponde. Filtramos
  // nosotros y desactivamos el filtro interno (`filter={null}`).
  const items = React.useMemo(() => {
    const q = normalizeGenre(inputValue)
    const selected = new Set(value.map(normalizeGenre))
    const matches = suggestions.filter(
      (s) => !selected.has(normalizeGenre(s)) && (q === "" || normalizeGenre(s).includes(q))
    )
    return createValue ? [...matches, createValue] : matches
  }, [inputValue, value, suggestions, createValue])

  return (
    <Combobox.Root
      multiple
      items={items}
      value={value}
      onValueChange={(next) => {
        onValueChange(next as string[])
        setInputValue("")
      }}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      filter={null}
    >
      <Combobox.Chips
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-xs rounded-m bg-bg-surface-2 px-s py-1.5",
          "border border-border text-body transition-colors",
          "focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/30",
          ariaInvalid &&
            "border-status-danger ring-2 ring-status-danger/30 focus-within:border-status-danger"
        )}
      >
        <Combobox.Value>
          {(selected: string[]) =>
            selected.map((genre) => (
              <Combobox.Chip
                key={genre}
                aria-label={genre}
                className="inline-flex items-center gap-1 rounded-full bg-bg-surface px-s py-0.5 text-caption text-fg-primary"
              >
                {genre}
                <Combobox.ChipRemove
                  aria-label={removeLabel(genre)}
                  className="inline-flex items-center justify-center rounded-full text-fg-secondary transition-colors hover:text-status-danger"
                >
                  <X className="size-3" aria-hidden={true} />
                </Combobox.ChipRemove>
              </Combobox.Chip>
            ))
          }
        </Combobox.Value>
        <Combobox.Input
          id={id}
          aria-describedby={ariaDescribedby}
          aria-invalid={ariaInvalid}
          placeholder={value.length === 0 ? placeholder : undefined}
          className="min-w-[8ch] flex-1 bg-transparent text-body text-fg-primary outline-none placeholder:text-fg-tertiary"
        />
      </Combobox.Chips>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50">
          <Combobox.Popup className="max-h-60 w-(--anchor-width) overflow-y-auto rounded-m border border-border bg-bg-surface p-1 shadow-md">
            <Combobox.Empty className="px-s py-1.5 text-body text-fg-tertiary">
              {emptyLabel}
            </Combobox.Empty>
            <Combobox.List>
              {(item: string) => (
                <Combobox.Item
                  key={item}
                  value={item}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-s px-s py-1.5",
                    "text-body text-fg-primary outline-none",
                    "data-highlighted:bg-bg-surface-2 data-selected:text-brand"
                  )}
                >
                  <span>{createValue === item ? createLabel(item) : item}</span>
                  <Combobox.ItemIndicator>
                    <Check className="size-4 text-brand" aria-hidden={true} />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
