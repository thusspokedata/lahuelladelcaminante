"use client"

import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
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
import type { ArtistDetail } from "@/services/artists"

const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  bio: z.string().optional(),
  origin: z.string().optional(),
  genres: z.string().optional(),
  instagram: z.string().optional(),
  spotify: z.string().optional(),
  youtube: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ExistingImage { id: string; url: string; publicId: string }
interface NewImage { url: string; publicId: string }

interface ArtistFormProps {
  artist?: ArtistDetail
  artistId?: string
}

export function ArtistForm({ artist, artistId }: ArtistFormProps) {
  const tCommon = useTranslations("common")
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()

  const social = artist?.socialMedia as Record<string, string> | null
  const isEdit = !!artistId

  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    artist?.images ?? []
  )
  const [newImages, setNewImages] = useState<NewImage[]>([])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: artist?.name ?? "",
      bio: artist?.bio ?? "",
      origin: artist?.origin ?? "",
      genres: artist?.genres.join(", ") ?? "",
      instagram: social?.instagram ?? "",
      spotify: social?.spotify ?? "",
      youtube: social?.youtube ?? "",
      tiktok: social?.tiktok ?? "",
      website: social?.website ?? "",
    },
  })

  function removeExistingImage(id: string) {
    setExistingImages((prev) => prev.filter((img) => img.id !== id))
  }

  function removeNewImage(publicId: string) {
    setNewImages((prev) => prev.filter((img) => img.publicId !== publicId))
  }

  async function onSubmit(data: FormData) {
    const payload = {
      name: data.name,
      bio: data.bio || undefined,
      origin: data.origin || undefined,
      genres: data.genres ? data.genres.split(",").map((g) => g.trim()).filter(Boolean) : [],
      socialMedia: {
        instagram: data.instagram || undefined,
        spotify: data.spotify || undefined,
        youtube: data.youtube || undefined,
        tiktok: data.tiktok || undefined,
        website: data.website || undefined,
      },
      ...(isEdit
        ? {
            keepImageIds: existingImages.map((img) => img.id),
            newImages,
          }
        : {
            images: newImages,
          }),
    }

    const res = await fetch(isEdit ? `/api/artists/${artistId}` : "/api/artists", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? tCommon("error"))
      return
    }

    toast.success(isEdit ? "Artista actualizado" : "Artista creado")
    router.push(`/${locale}/dashboard/artists`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label htmlFor="bio">Biografía</Label>
        <textarea
          id="bio"
          {...register("bio")}
          rows={4}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </div>

      {/* Origin + genres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="origin">Origen</Label>
          <Input id="origin" {...register("origin")} placeholder="Argentina" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="genres">Géneros <span className="text-muted-foreground font-normal">(separados por coma)</span></Label>
          <Input id="genres" {...register("genres")} placeholder="Tango, Milonga" />
        </div>
      </div>

      {/* Social */}
      <fieldset className="space-y-3 border border-border rounded-xl p-4">
        <legend className="text-sm font-semibold px-1">Redes sociales</legend>
        {(["instagram", "spotify", "youtube", "tiktok", "website"] as const).map((field) => (
          <div key={field} className="flex items-center gap-3">
            <Label className="w-20 text-xs capitalize shrink-0">{field}</Label>
            <Input {...register(field)} placeholder={`URL ${field}`} className="text-sm" />
          </div>
        ))}
      </fieldset>

      {/* Images */}
      <div className="space-y-3">
        <Label>Fotos</Label>

        {/* Existing */}
        {existingImages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {existingImages.map((img) => (
              <div key={img.id} className="relative group">
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-border">
                  <Image src={img.url} alt="" width={96} height={96} className="object-cover w-full h-full" />
                </div>
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New */}
        {newImages.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {newImages.map((img) => (
              <div key={img.publicId} className="relative group">
                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-primary/30">
                  <Image src={img.url} alt="" width={96} height={96} className="object-cover w-full h-full" />
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
            <Button type="button" variant="outline" size="sm" onClick={() => open()} className="rounded-full">
              ↑ Subir fotos (podés seleccionar varias)
            </Button>
          )}
        </CldUploadWidget>

        {existingImages.length === 0 && newImages.length === 0 && (
          <p className="text-xs text-muted-foreground">Sin fotos aún.</p>
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
