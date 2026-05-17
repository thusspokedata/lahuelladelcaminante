"use client"

/**
 * ArtistForm — crear o editar un perfil de artista desde el dashboard
 * creator.
 *
 * Rediseñado al sistema visual usando los primitives nuevos
 * (`FormField`, `FormInput`, `FormTextarea`, `FormSection`) +
 * `ImageUploader` extraído. **Lógica intacta** per spec: mismo schema
 * zod, mismo useForm, mismo state pattern para images, mismo payload
 * al `/api/artists` endpoint.
 *
 * Estructura en secciones:
 *  - "01 · Identidad": nombre, origen.
 *  - "02 · Bio": textarea con helper afectivo.
 *  - "03 · Géneros": input libre separado por comas.
 *  - "04 · Imagen": ImageUploader.
 *  - "05 · Redes sociales": 5 inputs URL opcionales agrupados.
 *
 * Sin cambios en campos, validaciones ni payload — solo presentación.
 */

import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import FormField from "@/components/forms/FormField"
import FormInput from "@/components/forms/FormInput"
import FormTextarea from "@/components/forms/FormTextarea"
import FormSection from "@/components/forms/FormSection"
import ImageUploader, {
  type ExistingImage,
  type PendingImage,
} from "@/components/cloudinary/ImageUploader"
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

/** Networks que renderizamos en la sección de redes sociales. Mantenido
 * como `const` array para que TS infiera el tuple — los `register(field)`
 * matchean el schema. Si se agrega/quita una red, actualizar el schema
 * arriba y este array juntos. */
const SOCIAL_FIELDS = ["instagram", "spotify", "youtube", "tiktok", "website"] as const

export function ArtistForm({ artist, artistId }: ArtistFormProps) {
  const tCommon = useTranslations("common")
  const tForms = useTranslations("forms")
  const tArtist = useTranslations("artistForm")
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()

  const social = artist?.socialMedia as Record<string, string> | null
  const isEdit = !!artistId

  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    artist?.images ?? []
  )
  const [newImages, setNewImages] = useState<PendingImage[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
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

  async function onSubmit(data: FormData) {
    const payload = {
      name: data.name,
      bio: data.bio || undefined,
      origin: data.origin || undefined,
      genres: data.genres
        ? data.genres
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean)
        : [],
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

    const res = await fetch(
      isEdit ? `/api/artists/${artistId}` : "/api/artists",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => null)
      toast.error(err?.error ?? tCommon("error"))
      return
    }

    toast.success(isEdit ? tCommon("artistUpdated") : tCommon("artistCreated"))
    router.push(`/${locale}/dashboard/artists`)
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2xl max-w-3xl"
      noValidate
    >
      <FormSection
        eyebrow={tArtist("sections.identity.eyebrow")}
        title={tArtist("sections.identity.title")}
      >
        <FormField
          label={tArtist("fields.name")}
          name="artist-name"
          required
          error={errors.name ? tForms("nameRequired") : undefined}
        >
          <FormInput
            id="artist-name"
            placeholder={tArtist("fields.namePlaceholder")}
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </FormField>

        <FormField label={tArtist("fields.origin")} name="artist-origin">
          <FormInput
            id="artist-origin"
            placeholder={tArtist("fields.originPlaceholder")}
            {...register("origin")}
          />
        </FormField>
      </FormSection>

      <FormSection
        eyebrow={tArtist("sections.bio.eyebrow")}
        title={tArtist("sections.bio.title")}
        description={tArtist("sections.bio.description")}
      >
        <FormField label={tArtist("fields.bio")} name="artist-bio">
          <FormTextarea
            id="artist-bio"
            placeholder={tArtist("fields.bioPlaceholder")}
            rows={6}
            {...register("bio")}
          />
        </FormField>
      </FormSection>

      <FormSection
        eyebrow={tArtist("sections.genres.eyebrow")}
        title={tArtist("sections.genres.title")}
      >
        <FormField
          label={tArtist("fields.genres")}
          name="artist-genres"
          helper={tArtist("fields.genresHelper")}
        >
          <FormInput
            id="artist-genres"
            placeholder={tArtist("fields.genresPlaceholder")}
            {...register("genres")}
          />
        </FormField>
      </FormSection>

      <FormSection
        eyebrow={tArtist("sections.image.eyebrow")}
        title={tArtist("sections.image.title")}
        description={tArtist("sections.image.description")}
      >
        <ImageUploader
          existing={existingImages}
          pending={newImages}
          onRemoveExisting={(id) =>
            setExistingImages((prev) => prev.filter((img) => img.id !== id))
          }
          onRemovePending={(publicId) =>
            setNewImages((prev) => prev.filter((img) => img.publicId !== publicId))
          }
          onUpload={(img) => setNewImages((prev) => [...prev, img])}
          triggerLabel={tForms("uploadPhotos")}
          emptyLabel={tForms("noImages")}
          newBadgeLabel={tForms("newBadge")}
        />
      </FormSection>

      <FormSection
        eyebrow={tArtist("sections.social.eyebrow")}
        title={tArtist("sections.social.title")}
        description={tArtist("sections.social.description")}
      >
        {SOCIAL_FIELDS.map((field) => (
          <FormField
            key={field}
            label={tArtist(`fields.social.${field}`)}
            name={`artist-${field}`}
          >
            <FormInput
              id={`artist-${field}`}
              type="url"
              inputMode="url"
              placeholder={tArtist(`fields.social.${field}Placeholder`)}
              {...register(field)}
            />
          </FormField>
        ))}
      </FormSection>

      <div className="flex flex-wrap items-center gap-s border-t border-border pt-l">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 bg-brand text-on-brand font-semibold hover:bg-brand-dim disabled:opacity-60"
        >
          {isSubmitting ? tCommon("loading") : tCommon("save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="h-11"
        >
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  )
}
