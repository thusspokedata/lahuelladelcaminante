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
  title: z.string().min(1),
  description: z.string().optional(),
  venue: z.string().min(1),
  city: z.string().min(1),
  address: z.string().optional(),
  organizer: z.string().optional(),
  genre: z.string().optional(),
  time: z.string().optional(),
  price: z.string().optional(),
  artistId: z.string().optional(),
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

interface ArtistOption {
  id: string
  name: string
}

interface EventFormProps {
  eventId?: string
  artists?: ArtistOption[]
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
    artistId?: string
    dates?: string[]
    images?: ExistingImage[]
  }
}

const GENRES = [
  "", "Tango", "Salsa", "Cumbia", "Reggaeton", "Merengue",
  "Son Cubano", "Bossa Nova", "Vallenato", "Flamenco Latino", "Latin Jazz",
  "Folklore", "Otros",
]

export function EventForm({ eventId, artists = [], defaultValues }: EventFormProps) {
  const tCommon = useTranslations("common")
  const tForms = useTranslations("forms")
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
      artistId: defaultValues?.artistId ?? "",
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
      artistId: data.artistId || undefined,
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

    toast.success(isEdit ? tCommon("eventUpdated") : tCommon("eventCreated"))
    router.push(`/${locale}/dashboard/events`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">{tForms("titleField")}</Label>
        <Input id="title" placeholder={tForms("titlePlaceholder")} {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{tForms("titleRequired")}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">{tForms("description")}</Label>
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
          <Label htmlFor="venue">{tForms("venue")}</Label>
          <Input id="venue" placeholder={tForms("venuePlaceholder")} {...register("venue")} />
          {errors.venue && <p className="text-xs text-destructive">{tForms("venueRequired")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">{tForms("city")}</Label>
          <Input id="city" placeholder={tForms("cityPlaceholder")} {...register("city")} />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label htmlFor="address">{tForms("address")}</Label>
        <Input
          id="address"
          placeholder={tForms("addressPlaceholder")}
          {...register("address")}
        />
        <p className="text-xs text-muted-foreground">
          {tForms("mapsHint")}
        </p>
      </div>

      {/* Artist selector */}
      {artists.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="artistId">{tForms("artistField")}</Label>
          <select
            id="artistId"
            {...register("artistId")}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          >
            <option value="">{tForms("noArtistLinked")}</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Genre + Time + Price */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="genre">{tForms("genre")}</Label>
          <select
            id="genre"
            {...register("genre")}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>{g || tForms("noGenre")}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time">{tForms("time")}</Label>
          <Input id="time" placeholder="21:00" {...register("time")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">{tForms("price")}</Label>
          <Input id="price" placeholder="€10 / Gratis" {...register("price")} />
        </div>
      </div>

      {/* Organizer */}
      <div className="space-y-1.5">
        <Label htmlFor="organizer">{tForms("organizer")}</Label>
        <Input id="organizer" placeholder="Nombre del organizador" {...register("organizer")} />
      </div>

      {/* Dates */}
      <div className="space-y-2">
        <Label>{tForms("dates")}</Label>
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
          {tForms("addDate")}
        </Button>
      </div>

      {/* Images */}
      <div className="space-y-3">
        <Label>{tForms("images")}</Label>

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
                  {tForms("newBadge")}
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
              {tForms("uploadPhotos")}
            </Button>
          )}
        </CldUploadWidget>

        {existingImages.length === 0 && newImages.length === 0 && (
          <p className="text-xs text-muted-foreground">{tForms("noImages")}</p>
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
