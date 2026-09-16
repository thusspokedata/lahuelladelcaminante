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
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import FormField, { InferredBadge } from "@/components/forms/FormField"
import FormInput from "@/components/forms/FormInput"
import FormTextarea from "@/components/forms/FormTextarea"
import FormSelect from "@/components/forms/FormSelect"
import FormSection from "@/components/forms/FormSection"
import FormError from "@/components/forms/FormError"
import { GenreCombobox } from "@/components/events/GenreCombobox"
import { dedupeGenres } from "@/lib/genres"
import ImageUploader, {
  type ExistingImage,
  type PendingImage,
} from "@/components/cloudinary/ImageUploader"
import { X, Loader2, Sparkles } from "lucide-react"
import type { ExtractedEvent } from "@/lib/flyer-extraction"

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  venue: z.string().min(1),
  city: z.string().min(1),
  address: z.string().optional(),
  organizer: z.string().optional(),
  genres: z.array(z.string()),
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
    genres?: string[]
    time?: string
    price?: string
    artistId?: string
    dates?: string[]
    images?: ExistingImage[]
  }
  /** Sugerencias para el combobox de género: base curada ∪ géneros usados. */
  genreSuggestions?: string[]
}

export function EventForm({
  eventId,
  artists = [],
  defaultValues,
  genreSuggestions = [],
}: EventFormProps) {
  const tCommon = useTranslations("common")
  const tForms = useTranslations("forms")
  const tEvent = useTranslations("eventForm")
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()

  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    defaultValues?.images ?? []
  )
  const [newImages, setNewImages] = useState<PendingImage[]>([])

  // Autocompletar con IA: estado de la request en vuelo + set de campos que
  // vinieron inferidos (para el badge). Se limpia por campo cuando el user edita.
  const [autofilling, setAutofilling] = useState(false)
  const [inferredFields, setInferredFields] = useState<Set<string>>(new Set())

  const {
    register,
    handleSubmit,
    control,
    setValue,
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
      genres: defaultValues?.genres ?? [],
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
    replace: replaceDates,
  } = useFieldArray({ control, name: "dates" })

  const inferredBadge = tEvent("autofill.inferredBadge")
  const flyerUrl = newImages[0]?.url ?? existingImages[0]?.url

  /** Quita un campo del set de inferidos (borra su badge) cuando el user lo edita. */
  const clearInferred = (name: string) =>
    setInferredFields((prev) => {
      if (!prev.has(name)) return prev
      const next = new Set(prev)
      next.delete(name)
      return next
    })

  /** register() + onChange que además limpia el badge de inferido del campo. */
  const registerWithClear = (name: Parameters<typeof register>[0]) => {
    const reg = register(name)
    return {
      ...reg,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        clearInferred(name)
        return reg.onChange(e)
      },
    }
  }

  async function handleAutofill() {
    if (!flyerUrl || autofilling) return
    setAutofilling(true)
    try {
      const res = await fetch("/api/events/extract-from-flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: flyerUrl, locale }),
      })
      if (!res.ok) {
        toast.error(tEvent("autofill.error"))
        return
      }
      const json = (await res.json().catch(() => null)) as
        | { data?: ExtractedEvent }
        | null
      const data = json?.data
      if (!data) {
        toast.error(tEvent("autofill.error"))
        return
      }

      const inferred = new Set<string>()
      const applyString = (
        name: "title" | "description" | "venue" | "city" | "address" | "organizer" | "time" | "price",
        field: { value: string; inferred: boolean }
      ) => {
        setValue(name, field.value, { shouldDirty: true })
        if (field.inferred && field.value) inferred.add(name)
      }

      applyString("title", data.title)
      applyString("description", data.description)
      applyString("venue", data.venue)
      applyString("city", data.city)
      applyString("address", data.address)
      applyString("organizer", data.organizer)
      applyString("time", data.time)
      applyString("price", data.price)

      setValue("genres", data.genres.value, { shouldDirty: true })
      if (data.genres.inferred && data.genres.value.length > 0) {
        inferred.add("genres")
      }

      if (data.dates.value.length > 0) {
        replaceDates(data.dates.value.map((value) => ({ value })))
        if (data.dates.inferred) inferred.add("dates")
      }

      setInferredFields(inferred)
      toast.success(tEvent("autofill.success"))
    } catch {
      toast.error(tEvent("autofill.error"))
    } finally {
      setAutofilling(false)
    }
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
      genres: dedupeGenres(data.genres ?? []),
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
          inferred={inferredFields.has("title")}
          inferredLabel={inferredBadge}
        >
          <FormInput
            id="event-title"
            placeholder={tEvent("fields.titlePlaceholder")}
            aria-invalid={Boolean(errors.title)}
            {...registerWithClear("title")}
          />
        </FormField>

        <FormField
          label={tEvent("fields.description")}
          name="event-description"
          inferred={inferredFields.has("description")}
          inferredLabel={inferredBadge}
        >
          <FormTextarea
            id="event-description"
            placeholder={tEvent("fields.descriptionPlaceholder")}
            rows={4}
            {...registerWithClear("description")}
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
            <span className="sr-only"> {tForms("required")}</span>
            {inferredFields.has("dates") ? (
              <InferredBadge label={inferredBadge} />
            ) : null}
          </legend>
          <div className="flex flex-col gap-xs">
            {dateFields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-xs">
                <FormInput
                  type="date"
                  className="flex-1"
                  aria-label={tEvent("fields.dateNth", { n: i + 1 })}
                  aria-invalid={Boolean(errors.dates)}
                  {...register(`dates.${i}.value`, {
                    onChange: () => clearInferred("dates"),
                  })}
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

        <FormField
          label={tEvent("fields.time")}
          name="event-time"
          inferred={inferredFields.has("time")}
          inferredLabel={inferredBadge}
        >
          <FormInput
            id="event-time"
            placeholder="21:00"
            {...registerWithClear("time")}
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
          inferred={inferredFields.has("venue")}
          inferredLabel={inferredBadge}
        >
          <FormInput
            id="event-venue"
            placeholder={tEvent("fields.venuePlaceholder")}
            aria-invalid={Boolean(errors.venue)}
            {...registerWithClear("venue")}
          />
        </FormField>

        <FormField
          label={tEvent("fields.city")}
          name="event-city"
          required
          error={errors.city ? tEvent("fields.cityRequired") : undefined}
          inferred={inferredFields.has("city")}
          inferredLabel={inferredBadge}
        >
          <FormInput
            id="event-city"
            placeholder={tEvent("fields.cityPlaceholder")}
            aria-invalid={Boolean(errors.city)}
            {...registerWithClear("city")}
          />
        </FormField>

        <FormField
          label={tEvent("fields.address")}
          name="event-address"
          helper={tEvent("fields.addressHelper")}
          inferred={inferredFields.has("address")}
          inferredLabel={inferredBadge}
        >
          <FormInput
            id="event-address"
            placeholder={tEvent("fields.addressPlaceholder")}
            {...registerWithClear("address")}
          />
        </FormField>

        <FormField
          label={tEvent("fields.organizer")}
          name="event-organizer"
          inferred={inferredFields.has("organizer")}
          inferredLabel={inferredBadge}
        >
          <FormInput
            id="event-organizer"
            placeholder={tEvent("fields.organizerPlaceholder")}
            {...registerWithClear("organizer")}
          />
        </FormField>
      </FormSection>

      <FormSection
        eyebrow={tEvent("sections.access.eyebrow")}
        title={tEvent("sections.access.title")}
      >
        <FormField
          label={tEvent("fields.price")}
          name="event-price"
          inferred={inferredFields.has("price")}
          inferredLabel={inferredBadge}
        >
          <FormInput
            id="event-price"
            placeholder={tEvent("fields.pricePlaceholder")}
            {...registerWithClear("price")}
          />
        </FormField>

        <FormField
          label={tEvent("fields.genre")}
          name="event-genre"
          helper={tEvent("fields.genreHelper")}
          inferred={inferredFields.has("genres")}
          inferredLabel={inferredBadge}
        >
          <Controller
            control={control}
            name="genres"
            render={({ field }) => (
              <GenreCombobox
                id="event-genre"
                aria-describedby="event-genre-helper"
                value={field.value ?? []}
                onValueChange={(next) => {
                  clearInferred("genres")
                  field.onChange(next)
                }}
                suggestions={genreSuggestions}
                placeholder={tEvent("fields.genrePlaceholder")}
                createLabel={(v) => tEvent("fields.genreCreate", { value: v })}
                emptyLabel={tEvent("fields.genreEmpty")}
                removeLabel={(g) => tEvent("fields.removeGenre", { genre: g })}
              />
            )}
          />
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

        <div className="flex flex-col gap-xs">
          <Button
            type="button"
            variant="outline"
            onClick={handleAutofill}
            disabled={!flyerUrl || autofilling}
            className="self-start"
          >
            {autofilling ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden={true} />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden={true} />
            )}
            {autofilling ? tEvent("autofill.loading") : tEvent("autofill.button")}
          </Button>
          <p className="text-caption text-fg-tertiary">
            {flyerUrl ? tEvent("autofill.help") : tEvent("autofill.hint")}
          </p>
        </div>
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
