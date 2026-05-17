"use client"

/**
 * EventForm — crear o editar un evento desde el dashboard creator.
 *
 * Rediseñado al sistema visual usando los primitives nuevos
 * (`FormField`, `FormInput`, `FormTextarea`, `FormSelect`,
 * `FormSection`) + `ImageUploader` extraído. **Lógica intacta** según
 * el spec del PR: mismo schema zod, mismo `useFieldArray` para fechas,
 * mismo state pattern para `existingImages`/`newImages`, mismo payload
 * al `/api/events` endpoint.
 *
 * Estructura en secciones para legibilidad:
 *  - "Lo básico": título, descripción, artista vinculado.
 *  - "Cuándo": array de fechas + horario.
 *  - "Dónde": venue, ciudad, dirección, organizador.
 *  - "Acceso y género": precio, género.
 *  - "Imagen": flyer(s) via ImageUploader.
 *
 * Sin cambios en validaciones, campos, ni en el payload — solo
 * presentación. Si en el futuro hay que agregar campos (capacity,
 * tickets URL parsed, etc.) eso entra en otra PR.
 */

import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import FormField from "@/components/forms/FormField"
import FormInput from "@/components/forms/FormInput"
import FormTextarea from "@/components/forms/FormTextarea"
import FormSelect from "@/components/forms/FormSelect"
import FormSection from "@/components/forms/FormSection"
import FormError from "@/components/forms/FormError"
import ImageUploader, {
  type ExistingImage,
  type PendingImage,
} from "@/components/cloudinary/ImageUploader"
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

/** Lista cerrada de géneros — `""` representa "sin género" (default
 * para nuevos eventos sin clasificar). Si se expande, mantener
 * consistente con el filtro de género en `/events`. */
const GENRES = [
  "",
  "Tango",
  "Salsa",
  "Cumbia",
  "Reggaeton",
  "Merengue",
  "Son Cubano",
  "Bossa Nova",
  "Vallenato",
  "Flamenco Latino",
  "Latin Jazz",
  "Folklore",
  "Otros",
]

export function EventForm({ eventId, artists = [], defaultValues }: EventFormProps) {
  const tCommon = useTranslations("common")
  const tForms = useTranslations("forms")
  const tEvent = useTranslations("eventForm")
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()

  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    defaultValues?.images ?? []
  )
  const [newImages, setNewImages] = useState<PendingImage[]>([])

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

  const {
    fields: dateFields,
    append: appendDate,
    remove: removeDate,
  } = useFieldArray({ control, name: "dates" })

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
      const err = await res.json().catch(() => null)
      toast.error(err?.error ?? tCommon("error"))
      return
    }

    toast.success(isEdit ? tCommon("eventUpdated") : tCommon("eventCreated"))
    router.push(`/${locale}/dashboard/events`)
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2xl max-w-3xl"
      noValidate
    >
      <FormSection
        eyebrow={tEvent("sections.basics.eyebrow")}
        title={tEvent("sections.basics.title")}
      >
        <FormField
          label={tEvent("fields.title")}
          name="event-title"
          required
          error={errors.title ? tForms("titleRequired") : undefined}
        >
          <FormInput
            id="event-title"
            placeholder={tEvent("fields.titlePlaceholder")}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
        </FormField>

        <FormField label={tEvent("fields.description")} name="event-description">
          <FormTextarea
            id="event-description"
            placeholder={tEvent("fields.descriptionPlaceholder")}
            rows={4}
            {...register("description")}
          />
        </FormField>

        {artists.length > 0 ? (
          <FormField label={tEvent("fields.artist")} name="event-artist">
            <FormSelect id="event-artist" {...register("artistId")}>
              <option value="">{tEvent("fields.noArtistLinked")}</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </FormSelect>
          </FormField>
        ) : null}
      </FormSection>

      <FormSection
        eyebrow={tEvent("sections.when.eyebrow")}
        title={tEvent("sections.when.title")}
      >
        {/* fieldset + legend semánticos para agrupar los inputs del field
            array — escapa al FormField wrapper (no aplica el patrón
            label-htmlFor cuando hay N inputs dinámicos). `aria-invalid`
            propagado a cada input cuando `errors.dates` está presente. */}
        <fieldset
          className="flex flex-col gap-xs border-0 p-0 m-0"
          aria-describedby={errors.dates ? "event-dates-error" : undefined}
        >
          <legend className="font-mono text-eyebrow uppercase text-fg-secondary leading-tight">
            {tEvent("fields.dates")}
            <span aria-hidden={true} className="ml-1 text-brand">
              *
            </span>
            <span className="sr-only"> (requerido)</span>
          </legend>
          <div className="flex flex-col gap-xs">
            {dateFields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-xs">
                <FormInput
                  type="date"
                  className="flex-1"
                  aria-label={tEvent("fields.dateNth", { n: i + 1 })}
                  aria-invalid={Boolean(errors.dates)}
                  {...register(`dates.${i}.value`)}
                />
                {dateFields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDate(i)}
                    aria-label={tEvent("fields.removeDate")}
                    className="text-fg-secondary hover:text-status-danger"
                  >
                    <X className="h-4 w-4" aria-hidden={true} />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
          {errors.dates ? (
            <FormError id="event-dates-error">
              {tEvent("fields.dateRequired")}
            </FormError>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendDate({ value: "" })}
            className="self-start"
          >
            {tEvent("fields.addDate")}
          </Button>
        </fieldset>

        <FormField label={tEvent("fields.time")} name="event-time">
          <FormInput
            id="event-time"
            placeholder="21:00"
            {...register("time")}
          />
        </FormField>
      </FormSection>

      <FormSection
        eyebrow={tEvent("sections.where.eyebrow")}
        title={tEvent("sections.where.title")}
      >
        <FormField
          label={tEvent("fields.venue")}
          name="event-venue"
          required
          error={errors.venue ? tForms("venueRequired") : undefined}
        >
          <FormInput
            id="event-venue"
            placeholder={tEvent("fields.venuePlaceholder")}
            aria-invalid={Boolean(errors.venue)}
            {...register("venue")}
          />
        </FormField>

        <FormField
          label={tEvent("fields.city")}
          name="event-city"
          required
          error={errors.city ? tEvent("fields.cityRequired") : undefined}
        >
          <FormInput
            id="event-city"
            placeholder={tEvent("fields.cityPlaceholder")}
            aria-invalid={Boolean(errors.city)}
            {...register("city")}
          />
        </FormField>

        <FormField
          label={tEvent("fields.address")}
          name="event-address"
          helper={tEvent("fields.addressHelper")}
        >
          <FormInput
            id="event-address"
            placeholder={tEvent("fields.addressPlaceholder")}
            {...register("address")}
          />
        </FormField>

        <FormField label={tEvent("fields.organizer")} name="event-organizer">
          <FormInput
            id="event-organizer"
            placeholder={tEvent("fields.organizerPlaceholder")}
            {...register("organizer")}
          />
        </FormField>
      </FormSection>

      <FormSection
        eyebrow={tEvent("sections.access.eyebrow")}
        title={tEvent("sections.access.title")}
      >
        <FormField label={tEvent("fields.price")} name="event-price">
          <FormInput
            id="event-price"
            placeholder={tEvent("fields.pricePlaceholder")}
            {...register("price")}
          />
        </FormField>

        <FormField label={tEvent("fields.genre")} name="event-genre">
          <FormSelect id="event-genre" {...register("genre")}>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g || tEvent("fields.noGenre")}
              </option>
            ))}
          </FormSelect>
        </FormField>
      </FormSection>

      <FormSection
        eyebrow={tEvent("sections.image.eyebrow")}
        title={tEvent("sections.image.title")}
        description={tEvent("sections.image.description")}
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
