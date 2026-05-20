/**
 * `/[locale]/sign-in` — pantalla de inicio de sesión rediseñada.
 *
 * Server component que arma el `AuthShell` 7:5 con:
 *  - Columna izquierda (col-span-7): heading + `<SignInForm>` (client) +
 *    footer rich-text con links a sign-up y apply.
 *  - Columna derecha (col-span-5, hidden en mobile): manifiesto editorial
 *    + 3 thumbnails 1:1 de eventos destacados + stats strip.
 *
 * Las dos queries de datos del panel (`getFeaturedEvents(3)` y
 * `getUpcomingStats()`) se disparan en paralelo. Ambas están cacheadas
 * con `unstable_cache` (5 min) — no añaden carga relevante a esta ruta
 * caliente.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT_v2.md` §1.1.
 */

import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import AuthShell from "@/components/auth/AuthShell"
import SignInForm from "@/components/auth/SignInForm"
import Eyebrow from "@/components/ui/Eyebrow"
import FlyerImage from "@/components/ui/FlyerImage"
import { getFeaturedEvents, getUpcomingStats } from "@/services/events"
import { sanitizeReturnTo } from "@/lib/safe-redirect"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "auth.signIn" })
  return { title: t("metaTitle") }
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ returnTo?: string | string[] }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // `returnTo`: ruta interna a la que volver tras el login, propagada por
  // el `proxy.ts` cuando intercepta un acceso no autenticado a una ruta
  // protegida. Se valida acá (trust boundary) — `sanitizeReturnTo`
  // descarta URLs externas y similares (anti open-redirect). `undefined`
  // si no es válida → el form cae a su default (`/dashboard`).
  const { returnTo: rawReturnTo } = await searchParams
  const returnTo =
    sanitizeReturnTo(
      typeof rawReturnTo === "string" ? rawReturnTo : undefined
    ) ?? undefined
  // El link "crear cuenta" debe arrastrar el `returnTo` para que, si la
  // persona se registra en vez de loguearse, igual vuelva a destino.
  const signUpHref = returnTo
    ? { pathname: "/sign-up", query: { returnTo } }
    : "/sign-up"

  const t = await getTranslations({ locale, namespace: "auth.signIn" })
  const tHero = await getTranslations({ locale, namespace: "auth.signIn.hero" })

  // Disparar las dos queries en paralelo — son independientes y ambas
  // cacheadas. Si una falla, igual queremos renderizar la otra (el form
  // izquierdo no depende de los datos del hero, sería peor degradar el
  // sign-in entero por una query de eventos).
  const [events, stats] = await Promise.all([
    getFeaturedEvents(3).catch(() => []),
    getUpcomingStats().catch(() => null),
  ])

  return (
    <AuthShell
      formAriaLabel={t("formAriaLabel")}
      heroAriaLabel={t("heroAriaLabel")}
      hero={
        <div className="flex flex-col gap-l">
          <Eyebrow accent="brand" as="p">
            {tHero("eyebrow")}
          </Eyebrow>
          <h2 className="text-display-m font-display leading-tight text-fg-primary">
            {tHero.rich("title", {
              accent: (chunks) => (
                <span className="text-editorial italic">{chunks}</span>
              ),
            })}
          </h2>
          <p className="text-body-l leading-relaxed text-fg-secondary max-w-[44ch]">
            {tHero("body")}
          </p>

          {events.length > 0 ? (
            <div className="mt-l grid grid-cols-3 gap-s">
              {events.map((ev) => (
                <FlyerImage
                  key={ev.id}
                  publicId={ev.coverImagePublicId ?? undefined}
                  src={ev.coverImage ?? undefined}
                  alt={ev.coverImageAlt ?? ev.title}
                  aspectRatio="1:1"
                  fallbackAccent="brand"
                  className="rounded-m"
                />
              ))}
            </div>
          ) : null}

          {stats ? (
            <p className="mt-s font-mono text-eyebrow uppercase text-fg-tertiary">
              {tHero("statsFormat", {
                shows: stats.shows,
                cities: stats.cities,
              })}
            </p>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-l">
        <Eyebrow accent="brand" as="p">
          {t("eyebrow")}
        </Eyebrow>
        <h1 className="text-display-l font-display leading-tight text-fg-primary">
          {t("title")}
        </h1>
        <p className="text-body leading-relaxed text-fg-secondary">
          {t("subtitle")}
        </p>

        <SignInForm returnTo={returnTo} />

        <p className="text-body-s text-fg-secondary">
          {t.rich("footer", {
            createAccount: (chunks) => (
              <Link
                href={signUpHref}
                className="font-semibold text-fg-primary underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
            applyAsArtist: (chunks) => (
              <Link
                href="/apply"
                className="font-semibold text-fg-primary underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </AuthShell>
  )
}
