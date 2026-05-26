/**
 * `/creators/[slug]` — perfil público de un creator.
 *
 * Muestra el avatar (o iniciales si no hay imagen), nombre, ciudad, bio
 * y links sociales; seguido de dos galerías: próximos eventos y eventos
 * pasados. Si no hay ninguno, un empty-state explícito.
 *
 * `notFound()` cubre: slug inexistente, usuario BLOCKED, rol distinto
 * de creator/admin (el service ya filtra todos esos casos).
 *
 * Spec: docs/superpowers/specs/2026-05-26-creator-profile-design.md
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { cn } from "@/lib/utils"
import {
  getCreatorBySlug,
  getUpcomingEventsByCreator,
  getPastEventsByCreator,
} from "@/services/creators"
import { EventCard } from "@/components/events/EventCard"
import SectionHeader from "@/components/ui/SectionHeader"

const SECTION_GAP_CLASS = "py-3xl"
const CONTAINER_STYLE = {
  maxWidth: "var(--layout-max-w)",
  paddingLeft: "var(--layout-gutter)",
  paddingRight: "var(--layout-gutter)",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const creator = await getCreatorBySlug(slug)
  if (!creator) return { title: "Creator — La Huella del Caminante" }
  return {
    title: `${creator.name} · La Huella del Caminante`,
    description:
      creator.bio?.slice(0, 160) ??
      `${creator.name} en La Huella del Caminante`,
    openGraph: {
      title: creator.name,
      description: creator.bio?.slice(0, 160) ?? undefined,
      images: creator.image ? [{ url: creator.image }] : [],
    },
  }
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const creator = await getCreatorBySlug(slug)
  if (!creator) notFound()

  const [upcoming, past, t] = await Promise.all([
    getUpcomingEventsByCreator(creator.id),
    getPastEventsByCreator(creator.id),
    getTranslations({ locale, namespace: "creators" }),
  ])

  const initials = creator.name
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div>
      {/* Header del perfil */}
      <section className={cn(SECTION_GAP_CLASS, "border-b border-border")}>
        <div className="mx-auto flex flex-col gap-l" style={CONTAINER_STYLE}>
          <div className="flex items-start gap-l">
            {creator.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.image}
                alt={creator.name}
                className="w-24 h-24 rounded-pill object-cover border border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-pill bg-bg-surface-2 border border-border flex items-center justify-center text-heading-l font-semibold text-fg-primary">
                {initials || "·"}
              </div>
            )}
            <div className="flex flex-col gap-xs">
              <h1 className="text-display-m sm:text-display-l font-display text-fg-primary leading-[1]">
                {creator.name}
              </h1>
              {creator.city ? (
                <p className="text-body-s text-fg-secondary">
                  {t("from")} {creator.city}
                </p>
              ) : null}
            </div>
          </div>

          {creator.bio ? (
            <p className="text-body-l text-fg-secondary leading-relaxed max-w-[60ch]">
              {creator.bio}
            </p>
          ) : null}

          {creator.socialMedia ? (
            <CreatorSocial social={creator.socialMedia} />
          ) : null}
        </div>
      </section>

      {/* Upcoming */}
      {upcoming.length > 0 ? (
        <section className={SECTION_GAP_CLASS}>
          <div className="mx-auto flex flex-col gap-xl" style={CONTAINER_STYLE}>
            <SectionHeader title={t("upcomingEvents")} />
            <div className="grid grid-cols-1 gap-l sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="default"
                  priority={i === 0}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Past */}
      {past.length > 0 ? (
        <section className={cn(SECTION_GAP_CLASS, "border-t border-border")}>
          <div className="mx-auto flex flex-col gap-xl" style={CONTAINER_STYLE}>
            <SectionHeader title={t("pastEvents")} />
            <div className="grid grid-cols-1 gap-l sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="default"
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Empty state */}
      {upcoming.length === 0 && past.length === 0 ? (
        <section className={SECTION_GAP_CLASS}>
          <div className="mx-auto" style={CONTAINER_STYLE}>
            <p className="text-body-l text-fg-secondary">{t("noEvents")}</p>
          </div>
        </section>
      ) : null}
    </div>
  )
}

type CreatorSocialMedia = NonNullable<
  Awaited<ReturnType<typeof getCreatorBySlug>>
>["socialMedia"]

function CreatorSocial({ social }: { social: NonNullable<CreatorSocialMedia> }) {
  const items: { label: string; url: string }[] = []
  if (social.instagram)
    items.push({
      label: "Instagram",
      url: `https://instagram.com/${social.instagram}`,
    })
  if (social.website) items.push({ label: "Web", url: social.website })
  if (social.other)
    items.push({ label: social.other.label, url: social.other.url })
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-m">
      {items.map((it) => (
        <a
          key={it.url}
          href={it.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-s text-brand hover:underline"
        >
          {it.label} →
        </a>
      ))}
    </div>
  )
}
