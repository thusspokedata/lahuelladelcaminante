"use client"

import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CldUploadWidget } from "next-cloudinary"
import Image from "next/image"
import { X } from "lucide-react"

const schema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  venue: z.string().min(1, "El venue es obligatorio"),
  city: z.string().min(1, "La ciudad es obligatoria"),
  address: z.string().optional(),
  organizer: z.string().optional(),
  genre: z.string().optional(),
  time: z.string().optional(),
  price: z.string().optional(),
  dates: z.array(z.object({ value: z.string().min(1) })).min(1),
})

type FormData = z.infer<typeof schema>

interface ExistingImage {
  id: string
  url: string
  publicId: string
}

interface NewImage {
  url: string
  publicId: string
}

interface EventFormProps {
  eventId?: string
  defaultValues?: {
    title?: string
    description?: string
    venue?: string
    city?: string
    address?: string
    organizer?: string
    genre?: string
    time?: string
    price?: string
    dates?: string[]
    images?: ExistingImage[]
  }
}

const GENRES = [
  "", "Tango", "Salsa", "Cumbia", "Reggaeton", "Merengue",
  "Son Cubano", "Bossa Nova", "Vallenato", "Flamenco Latino", "Latin Jazz",
  "Folklore", "Otros",
]

export function EventForm({ eventId, defaultValues }: EventFormProps) {
  const tCommon = useTranslations("common")
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()

  // Existing images (can be removed one by one)
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    defaultValues?.images ?? []
  )
  // New images uploaded in this session
  const [newImages, setNewImages] = useState<NewImage[]>([])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      venue: defaultValues?.venue ?? "",
      city: defaultValues?.city ?? "",
      address: defaultValues?.address ?? "",
      organizer: defaultValues?.organizer ?? "",
      genre: defaultValues?.genre ?? "",
      time: defaultValues?.time ?? "",
      price: defaultValues?.price ?? "",
      dates: defaultValues?.dates?.length
        ? defaultValues.dates.map((d) => ({ value: d.slice(0, 10) }))
        : [{ value: "" }],
    },
  })

  const { fields: dateFields, append: appendDate, remove: removeDate } = useFieldArray({
    control,
    name: "dates",
  })

  function removeExistingImage(id: string) {
    setExistingImages((prev) => prev.filter((img) => img.id !== id))
  }

  function removeNewImage(publicId: string) {
    setNewImages((prev) => prev.filter((img) => img.publicId !== publicId))
  }

  async function onSubmit(data: FormData) {
    const location = `${data.venue}, ${data.city}`
    const isEdit = !!eventId

    const payload = {
      title: data.title,
      description: data.description,
      location,
      address: data.address || undefined,
      organizer: data.organizer,
      genre: data.genre || undefined,
      time: data.time,
      price: data.price,
      dates: data.dates.map((d) => new Date(d.value).toISOString()),
      ...(isEdit
        ? {
            keepImageIds: existingImages.map((img) => img.id),
            newImages: newImages,
          }
        : {
            images: newImages,
          }),
    }

    const res = await fetch(
      isEdit ? `/api/events/${eventId}` : "/api/events",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? tCommon("error"))
      return
    }

    toast.success(isEdit ? "Evento actualizado" : "Evento creado")
    router.push(`/${locale}/dashboard/events`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Título *</Label>
        <Input id="title" placeholder="Ej: Noche de Tango en Berlín" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          {...register("description")}
          rows={3}
          placeholder="Describe el evento..."
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </div>

      {/* Venue + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="venue">Venue / Lugar *</Label>
          <Input id="venue" placeholder="Ej: Tango Bar Loca" {...register("venue")} />
          {errors.venue && <p className="text-xs text-destructive">{errors.venue.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Ciudad *</Label>
          <Input id="city" placeholder="Ej: Berlin" {...register("city")} />
          {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          placeholder="Ej: Schlesische Str. 38, 10997 Berlin"
          {...register("address")}
        />
        <p className="text-xs text-muted-foreground">
          Se mostrará un enlace para abrir en Google Maps.
        </p>
      </div>

      {/* Genre + Time + Price */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="genre">Género</Label>
          <select
            id="genre"
            {...register("genre")}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>{g || "— Sin género —"}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time">Hora</Label>
          <Input id="time" placeholder="21:00" {...register("time")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Precio</Label>
          <Input id="price" placeholder="€10 / Gratis" {...register("price")} />
        </div>
      </div>

      {/* Organizer */}
      <div className="space-y-1.5">
        <Label htmlFor="organizer">Organizador</Label>
        <Input id="organizer" placeholder="Nombre del organizador" {...register("organizer")} />
      </div>

      {/* Dates */}
      <div className="space-y-2">
        <Label>Fechas *</Label>
        <div className="space-y-2">
          {dateFields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-center">
              <Input type="date" {...register(`dates.${i}.value`)} className="flex-1" />
              {dateFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDate(i)}
                  className="text-muted-foreground hover:text-destructive px-2"
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendDate({ value: "" })}
          className="rounded-full"
        >
          + Agregar fecha
        </Button>
      </div>

      {/* Images */}
      <div className="space-y-3">
        <Label>Imágenes</Label>

        {/* Existing images */}
        {existingImages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {existingImages.map((img) => (
              <div key={img.id} className="relative group">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-border">
                  <Image
                    src={img.url}
                    alt=""
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Quitar imagen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New images preview */}
        {newImages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {newImages.map((img) => (
              <div key={img.publicId} className="relative group">
                <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-primary/30">
                  <Image
                    src={img.url}
                    alt=""
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeNewImage(img.publicId)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-1 left-1 right-1 bg-primary/80 text-white text-[9px] text-center rounded px-1 py-0.5">
                  Nueva
                </div>
              </div>
            ))}
          </div>
        )}

        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          options={{ multiple: true, maxFiles: 10 }}
          onSuccess={(result) => {
            if (result.info && typeof result.info === "object" && "secure_url" in result.info) {
              const info = result.info as { secure_url: string; public_id: string }
              setNewImages((prev) => [...prev, { url: info.secure_url, publicId: info.public_id }])
            }
          }}
        >
          {({ open }) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => open()}
              className="rounded-full"
            >
              ↑ Subir fotos (podés seleccionar varias)
            </Button>
          )}
        </CldUploadWidget>

        {existingImages.length === 0 && newImages.length === 0 && (
          <p className="text-xs text-muted-foreground">Sin imágenes. Puedes subir una o más.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="rounded-full px-8">
          {isSubmitting ? tCommon("loading") : tCommon("save")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-full px-8">
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  )
}
