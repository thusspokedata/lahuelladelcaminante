"use client"

import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CldUploadWidget } from "next-cloudinary"
import type { ArtistDetail } from "@/services/artists"

const schema = z.object({
  name: z.string().min(1),
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

interface ArtistFormProps {
  artist?: ArtistDetail
  artistId?: string
}

export function ArtistForm({ artist, artistId }: ArtistFormProps) {
  const tCommon = useTranslations("common")
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()

  const social = artist?.socialMedia as Record<string, string> | null

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
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

  const isEdit = !!artistId
  const images = watch() // just to force re-render on upload

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
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <div className="space-y-1">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="bio">Biografía</Label>
        <textarea
          id="bio"
          {...register("bio")}
          rows={4}
          className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="origin">Origen</Label>
          <Input id="origin" {...register("origin")} placeholder="Argentina" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="genres">Géneros (separados por coma)</Label>
          <Input id="genres" {...register("genres")} placeholder="Tango, Milonga" />
        </div>
      </div>

      <fieldset className="space-y-3 border rounded-lg p-4">
        <legend className="text-sm font-medium px-1">Redes sociales</legend>
        {(["instagram", "spotify", "youtube", "tiktok", "website"] as const).map((field) => (
          <div key={field} className="flex items-center gap-2">
            <Label className="w-20 text-xs capitalize">{field}</Label>
            <Input {...register(field)} placeholder={`URL ${field}`} className="text-sm" />
          </div>
        ))}
      </fieldset>

      <div className="space-y-2">
        <Label>Imagen de perfil</Label>
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          onSuccess={() => {
            toast.success("Imagen subida")
          }}
        >
          {({ open }) => (
            <Button type="button" variant="outline" size="sm" onClick={() => open()}>
              Subir imagen
            </Button>
          )}
        </CldUploadWidget>
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
