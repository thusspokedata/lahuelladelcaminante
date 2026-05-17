"use client"

/**
 * ImageUploader — wrapper de `CldUploadWidget` con UI estilizada por tokens.
 *
 * Extracción del patrón duplicado que vivía inline en `EventForm.tsx` y
 * `ArtistForm.tsx`. Ambos forms gestionan dos buckets de imágenes:
 *  - **existing**: imágenes ya en DB (se pueden quitar individualmente
 *    para excluirlas del save).
 *  - **pending**: imágenes subidas en esta sesión, todavía no commiteadas
 *    al DB (se incluyen en el save al submit).
 *
 * Este componente solo PRESENTA y dispara callbacks. El state vive en
 * el caller (cada form tiene su propia useState porque también maneja
 * el resto del payload). API explícita con `existing`/`pending` separados
 * porque la distinción es visual (badge "NUEVO") y semántica (existing
 * tiene `id` del DB, pending solo `publicId` de Cloudinary).
 *
 * Lógica de Cloudinary intacta: mismos `uploadPreset`, `options.multiple`,
 * `options.maxFiles` (default 10), mismo parseo de `result.info`. NO se
 * tocan transformaciones ni la integración del SDK — solo presentación.
 *
 * Decisión de UX del dropzone: el spec describe un área dashed con texto
 * centrado, pero `CldUploadWidget` provee su propio modal — no se puede
 * implementar drag-and-drop directo sin reescribir el upload flow.
 * Compromiso: el "trigger" es un button visualmente parecido a un
 * dropzone (border dashed, texto centrado, hover border-brand) que abre
 * el modal del widget al click. UX consistente con el spec; lógica
 * intacta.
 */

import { CldUploadWidget } from "next-cloudinary"
import Image from "next/image"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ExistingImage {
  id: string
  url: string
  publicId: string
}

export interface PendingImage {
  url: string
  publicId: string
}

export interface ImageUploaderProps {
  existing: ExistingImage[]
  pending: PendingImage[]
  onRemoveExisting: (id: string) => void
  onRemovePending: (publicId: string) => void
  onUpload: (image: PendingImage) => void
  /** Copy del trigger ("Subir fotos", "Agregar flyer", etc.). */
  triggerLabel: string
  /** Copy del estado vacío ("Todavía no hay imágenes"). */
  emptyLabel: string
  /** Badge sobre cada `pending` image ("NUEVO"). */
  newBadgeLabel: string
  /** Default 10. Pasar otro si querés cap distinto por form. */
  maxFiles?: number
  className?: string
}

export default function ImageUploader({
  existing,
  pending,
  onRemoveExisting,
  onRemovePending,
  onUpload,
  triggerLabel,
  emptyLabel,
  newBadgeLabel,
  maxFiles = 10,
  className,
}: ImageUploaderProps) {
  const hasAny = existing.length > 0 || pending.length > 0

  return (
    <div className={cn("flex flex-col gap-m", className)}>
      {hasAny ? (
        <div className="flex flex-wrap gap-s">
          {existing.map((img) => (
            <ImageThumb
              key={img.id}
              src={img.url}
              onRemove={() => onRemoveExisting(img.id)}
            />
          ))}
          {pending.map((img) => (
            <ImageThumb
              key={img.publicId}
              src={img.url}
              variant="pending"
              badgeLabel={newBadgeLabel}
              onRemove={() => onRemovePending(img.publicId)}
            />
          ))}
        </div>
      ) : null}

      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        options={{ multiple: true, maxFiles }}
        onSuccess={(result) => {
          // Mismo parseo defensivo que el código original — `result.info`
          // puede ser string (caso "upload from URL") u objeto con
          // `secure_url` + `public_id`. Solo procesamos el caso objeto.
          if (
            result.info &&
            typeof result.info === "object" &&
            "secure_url" in result.info
          ) {
            const info = result.info as {
              secure_url: string
              public_id: string
            }
            onUpload({ url: info.secure_url, publicId: info.public_id })
          }
        }}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open()}
            className={cn(
              "flex flex-col items-center justify-center gap-xs",
              "min-h-[120px] rounded-m px-l py-l",
              "bg-bg-surface-2 border border-dashed border-border",
              "text-body-s text-fg-secondary",
              "transition-colors cursor-pointer",
              "hover:border-brand hover:text-fg-primary",
              "focus-visible:outline-none focus-visible:border-brand",
              "focus-visible:ring-2 focus-visible:ring-brand/30"
            )}
          >
            <span className="font-mono text-eyebrow uppercase text-fg-tertiary">
              {triggerLabel}
            </span>
            {!hasAny ? (
              <span className="text-caption text-fg-tertiary">{emptyLabel}</span>
            ) : null}
          </button>
        )}
      </CldUploadWidget>
    </div>
  )
}

/** Thumb interno — 96×96, con botón de X superpuesto en hover. */
function ImageThumb({
  src,
  variant = "existing",
  badgeLabel,
  onRemove,
}: {
  src: string
  variant?: "existing" | "pending"
  badgeLabel?: string
  onRemove: () => void
}) {
  return (
    <div className="relative group">
      <div
        className={cn(
          "w-24 h-24 rounded-m overflow-hidden border",
          variant === "pending"
            ? "border-2 border-editorial"
            : "border-border"
        )}
      >
        <Image
          src={src}
          alt=""
          width={96}
          height={96}
          className="object-cover w-full h-full"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Quitar imagen"
        className={cn(
          "absolute -top-2 -right-2 w-6 h-6 rounded-full",
          "bg-status-danger text-on-brand",
          "flex items-center justify-center shadow-md",
          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          "transition-opacity outline-none",
          "focus-visible:ring-2 focus-visible:ring-status-danger/40"
        )}
      >
        <X className="w-3.5 h-3.5" aria-hidden={true} />
      </button>
      {variant === "pending" && badgeLabel ? (
        <span
          aria-hidden={true}
          className={cn(
            "absolute bottom-1 left-1 right-1",
            "bg-editorial text-on-editorial",
            "font-mono text-[9px] uppercase tracking-wider",
            "text-center rounded-sm px-1 py-0.5"
          )}
        >
          {badgeLabel}
        </span>
      ) : null}
    </div>
  )
}
