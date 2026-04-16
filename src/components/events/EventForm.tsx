"use client"

import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CldUploadWidget } from "next-cloudinary"

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().min(1),
  organizer: z.string().optional(),
  genre: z.string().optional(),
  time: z.string().optional(),
  price: z.string().optional(),
  artistId: z.string().optional(),
  dates: z.array(z.object({ value: z.string() })).min(1),
  images: z.array(z.object({ url: z.string(), alt: z.string().optional(), publicId: z.string() })).optional(),
})

type FormData = z.infer<typeof schema>

export function EventForm() {
  const tCommon = useTranslations("common")
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { dates: [{ value: "" }], images: [] },
  })

  const { fields: dateFields, append: appendDate, remove: removeDate } = useFieldArray({ control, name: "dates" })
  const images = watch("images") ?? []

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        dates: data.dates.map((d) => new Date(d.value).toISOString()),
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? tCommon("error"))
      return
    }

    toast.success("Evento creado")
    router.push(`/${locale}/dashboard/events`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <div className="space-y-1">
        <Label htmlFor="title">Título *</Label>
        <Input id="title" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          {...register("description")}
          rows={3}
          className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="location">Lugar *</Label>
          <Input id="location" {...register("location")} />
          {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="genre">Género</Label>
          <Input id="genre" {...register("genre")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="time">Hora</Label>
          <Input id="time" {...register("time")} placeholder="21:00" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="price">Precio</Label>
          <Input id="price" {...register("price")} placeholder="€10 / Gratis" />
        </div>
        <div className="space-y-1 col-span-2">
          <Label htmlFor="organizer">Organizador</Label>
          <Input id="organizer" {...register("organizer")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fechas *</Label>
        {dateFields.map((field, i) => (
          <div key={field.id} className="flex gap-2">
            <Input type="date" {...register(`dates.${i}.value`)} />
            {dateFields.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeDate(i)}>×</Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => appendDate({ value: "" })}>
          + Agregar fecha
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Imágenes</Label>
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          onSuccess={(result) => {
            if (result.info && typeof result.info === "object" && "secure_url" in result.info) {
              const info = result.info as { secure_url: string; public_id: string }
              setValue("images", [...images, { url: info.secure_url, publicId: info.public_id }])
            }
          }}
        >
          {({ open }) => (
            <Button type="button" variant="outline" size="sm" onClick={() => open()}>
              Subir imagen
            </Button>
          )}
        </CldUploadWidget>
        {images.length > 0 && (
          <p className="text-xs text-muted-foreground">{images.length} imagen(es) subida(s)</p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("loading") : tCommon("save")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  )
}
