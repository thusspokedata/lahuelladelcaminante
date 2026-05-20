/**
 * `/[locale]/sign-up` — pantalla de crear cuenta rediseñada.
 *
 * Server component que arma el `AuthShell` 7:5 con:
 *  - Columna izquierda (col-span-7): heading + `<SignUpForm>` (client) +
 *    footer con link a sign-in.
 *  - Columna derecha (col-span-5, hidden en mobile): 3 step cards del
 *    journey (creás cuenta → aplicás → publicás) con tiempos + bloque
 *    de soporte con link a `/contact`.
 *
 * Sin datos dinámicos en esta pantalla (a diferencia de /sign-in que
 * fetcha eventos destacados) — el hero es puro contenido editorial.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT_v2.md` §1.2.
 */

import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import AuthShell from "@/components/auth/AuthShell"
import SignUpForm from "@/components/auth/SignUpForm"
import Eyebrow from "@/components/ui/Eyebrow"
import { sanitizeReturnTo } from "@/lib/safe-redirect"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "auth.signUp" })
  return { title: t("metaTitle") }
}

/** Step cards de la columna hero. Los textos vienen de i18n; este array
 * solo define la estructura visual (número + key del título + key del
 * timing). Mantener acá (no en el JSON) para que la cantidad de pasos
 * sea decisión de código, no de traducción. */
const STEPS = [
  { number: "01", titleKey: "step1Title", timeKey: "step1Time" },
  { number: "02", titleKey: "step2Title", timeKey: "step2Time" },
  { number: "03", titleKey: "step3Title", timeKey: "step3Time" },
] as const

export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ returnTo?: string | string[] }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // `returnTo`: ruta interna a la que volver tras el signup, propagada
  // por el `proxy.ts` cuando intercepta un acceso no autenticado a una
  // ruta protegida. Se valida acá (trust boundary) — `sanitizeReturnTo`
  // descarta URLs externas y similares (anti open-redirect). `undefined`
  // si no es válida → el form cae a su default (la home).
  const { returnTo: rawReturnTo } = await searchParams
  const returnTo =
    sanitizeReturnTo(
      typeof rawReturnTo === "string" ? rawReturnTo : undefined
    ) ?? undefined
  // Si la persona llegó acá desde una ruta protegida, el link a sign-in
  // debe arrastrar el `returnTo` para no perderlo en el cruce.
  const signInHref = returnTo
    ? { pathname: "/sign-in", query: { returnTo } }
    : "/sign-in"

  const t = await getTranslations({ locale, namespace: "auth.signUp" })
  const tHero = await getTranslations({ locale, namespace: "auth.signUp.hero" })

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

          <ol className="mt-l flex flex-col gap-m">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className="flex items-start gap-m rounded-l border border-border bg-bg-surface-2 p-l"
              >
                <span
                  aria-hidden={true}
                  className="font-mono text-eyebrow text-editorial leading-none pt-[2px]"
                >
                  {step.number}
                </span>
                <div className="flex flex-col gap-xs">
                  <p className="text-body font-semibold text-fg-primary leading-snug">
                    {tHero(step.titleKey)}
                  </p>
                  <p className="text-caption text-fg-tertiary">
                    {tHero(step.timeKey)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-l text-body-s leading-relaxed text-fg-secondary">
            {tHero.rich("support", {
              contactLink: (chunks) => (
                <Link
                  href="/contact"
                  className="font-semibold text-fg-primary underline-offset-4 hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-l">
        <Eyebrow accent="brand" as="p">
          {t("eyebrow")}
        </Eyebrow>
        <h1 className="text-display-l font-display leading-tight text-fg-primary">
          {t.rich("title", {
            accent: (chunks) => (
              <span className="text-brand italic">{chunks}</span>
            ),
          })}
        </h1>
        <p className="text-body leading-relaxed text-fg-secondary">
          {t("subtitle")}
        </p>

        <SignUpForm returnTo={returnTo} />

        <p className="text-body-s text-fg-secondary">
          {t.rich("footer", {
            signInLink: (chunks) => (
              <Link
                href={signInHref}
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
