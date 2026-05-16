/**
 * EventAccessCTA — renderiza el CTA de acceso al evento según el modo
 * interpretado por `getEventAccessMode` del `Event.price`. Server async
 * (consume `getTranslations`). Reutilizado por el bloque principal del
 * detalle y por el `StickyCTABar` mobile.
 *
 * 5 modos visuales:
 *  - `tickets`   → botón sangre grande con link externo. Precio (`priceText`)
 *                  como subtítulo si está disponible.
 *  - `voluntary` → etiqueta no-clickeable sobre `bg-surface-2`. Texto chico
 *                  explicativo debajo ("lo que cada uno pueda...").
 *  - `free`      → etiqueta no-clickeable. Nota "no requiere reserva".
 *  - `door`      → etiqueta no-clickeable. Si hay precio, lo muestra.
 *  - `unknown`   → bloque chico con el texto original del creator + nota
 *                  "consultá al organizador".
 *
 * Layout: variantes `compact` (sticky bar mobile) y `default` (bloque
 * principal). En `compact`, el botón y la etiqueta usan tamaño chico para
 * caber en el bar; el subtítulo se omite.
 */

import { getTranslations } from "next-intl/server"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getEventAccessMode } from "@/lib/event-access"

export interface EventAccessCTAProps {
  /** Texto libre del campo `Event.price`. */
  price: string | null
  /** Locale resuelto del request. */
  locale: string
  /** `default` = bloque grande del body. `compact` = sticky bar mobile. */
  variant?: "default" | "compact"
  className?: string
}

export default async function EventAccessCTA({
  price,
  locale,
  variant = "default",
  className,
}: EventAccessCTAProps) {
  const t = await getTranslations({ locale, namespace: "eventDetail.access" })
  const access = getEventAccessMode(price)
  const isCompact = variant === "compact"

  if (access.mode === "tickets" && access.ticketUrl) {
    return (
      <div className={cn("flex flex-col gap-xs", className)}>
        <a
          href={access.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center justify-center gap-s rounded-pill bg-brand text-on-brand font-semibold transition-all duration-200 ease-out hover:bg-brand-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
            isCompact ? "px-l py-s text-body" : "px-xl py-m text-body-l"
          )}
        >
          <span>{t("tickets")}</span>
          <ArrowUpRight className={isCompact ? "w-4 h-4" : "w-5 h-5"} aria-hidden />
        </a>
        {!isCompact && access.priceText ? (
          <p className="text-body-s text-fg-secondary">{access.priceText}</p>
        ) : null}
      </div>
    )
  }

  // Las 4 variantes no-clickeables comparten el mismo skeleton: bloque
  // sobre surface-2 con título grande + nota chica. Cambia el texto.
  const labelByMode: Record<typeof access.mode, string> = {
    tickets: t("tickets"), // unreachable acá (ya manejado arriba) pero satisface el tipo
    voluntary: t("voluntary"),
    free: t("free"),
    door: t("door"),
    unknown: access.priceText ?? "",
  }
  const noteByMode: Record<typeof access.mode, string | null> = {
    tickets: null,
    voluntary: t("voluntaryNote"),
    free: t("freeNote"),
    door: null,
    unknown: t("unknownNote"),
  }

  const label = labelByMode[access.mode]
  const note = noteByMode[access.mode]
  const secondaryText =
    access.mode === "door" ? access.priceText : null

  return (
    <div
      className={cn(
        "flex flex-col gap-xs rounded-l bg-bg-surface-2 border border-border",
        isCompact ? "px-l py-s" : "px-l py-m",
        className
      )}
    >
      <p
        className={cn(
          "font-semibold text-fg-primary leading-tight",
          isCompact ? "text-body" : "text-body-l"
        )}
      >
        {label}
        {secondaryText ? (
          <span className="ml-s text-fg-secondary font-normal">
            · {secondaryText}
          </span>
        ) : null}
      </p>
      {!isCompact && note ? (
        <p className="text-body-s text-fg-secondary">{note}</p>
      ) : null}
    </div>
  )
}
