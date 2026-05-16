/**
 * `/[locale]/user-pending` — pantalla mostrada cuando un user logueado
 * tiene `UserProfile.status === "PENDING"`. Disparada por `requireActive`
 * (en `src/services/auth.ts`) que redirige acá antes de servir cualquier
 * ruta protegida.
 *
 * Rediseño del handoff v2 §1.4 con peso editorial: bombilla glow +
 * eyebrow dorado + h1 cálido + fecha de aplicación visible + escape
 * hatch si pasaron más de 3 días.
 *
 * FLUJO QUE DISPARA PENDING (activo desde PR #23 backend hardening):
 * El hook `databaseHooks.user.create.after` en `src/lib/auth.ts` escribe
 * `status: PENDING` por default para toda cuenta nueva (email/password
 * y Google OAuth). Excepciones: cuenta con Application APPROVED previa
 * (sign-up post-aprobación → ACTIVE + creator) o `user.role === "admin"`
 * (seed manual → ACTIVE). Cuando admin aprueba una Application, el
 * endpoint `/api/apply/[id]` PATCH bumpea el User asociado a ACTIVE +
 * creator, destrabando el panel.
 *
 * Application matching: `Application` no tiene FK con `User`. Se
 * matchea por email (mismo pattern que el hook). Si no hay match
 * (caso: status PENDING por vía admin sin Application previa), el copy
 * degrada a una variante sin fecha (`bodyNoDate`).
 *
 * Guard de seguridad: si no hay session, redirect a `/sign-in` (no
 * tener este guard antes era una regresión menor — la URL es accesible
 * sin auth y mostraba el cardo viejo a anónimos).
 */

import { getTranslations, setRequestLocale } from "next-intl/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/services/auth"
import { prisma } from "@/lib/prisma"
import { Link } from "@/i18n/navigation"
import BrandLockup from "@/components/brand/BrandLockup"
import StatusHero from "@/components/auth/StatusHero"
import SignOutButton from "@/components/auth/SignOutButton"
import Eyebrow from "@/components/ui/Eyebrow"
import { Button } from "@/components/ui/button"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "account.pending" })
  return { title: t("metaTitle") }
}

/** Formato amigable de fecha. ES: `15 de mayo` · EN: `May 15` ·
 * DE: `15. Mai`. Sin año — el copy ya implica "hace poco" (1-2 días). */
function formatApplicationDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
  }).format(date)
}

export default async function UserPendingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // Guard de auth — si llega un anónimo, mandarlo a sign-in en lugar
  // de mostrar la pantalla "tu cuenta está en revisión" (que sería
  // confuso para alguien que no tiene cuenta).
  const user = await getCurrentUser()
  if (!user) {
    redirect(`/${locale}/sign-in`)
  }

  const t = await getTranslations({ locale, namespace: "account.pending" })
  const tAccount = await getTranslations({ locale, namespace: "account" })

  // Application por email. Devolver la más reciente — un user podría
  // haber aplicado más de una vez con el mismo email.
  const application = await prisma.application.findFirst({
    where: { email: user.email },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  })

  const formattedDate = application
    ? formatApplicationDate(application.createdAt, locale)
    : null

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Mini header austero — solo BrandLockup, sin Header global ni
          LanguageSwitcher. Las pantallas de estado de cuenta son
          terminales: el user no debería navegar nada acá excepto
          cerrar sesión o volver a la agenda pública. */}
      <header className="flex h-16 items-center px-l">
        <BrandLockup orientation="horizontal" href="/" />
      </header>

      <main className="mx-auto flex max-w-[560px] flex-col items-center gap-l px-l py-2xl text-center">
        <StatusHero variant="pending" />

        <Eyebrow accent="editorial" as="p">
          {t("eyebrow")}
        </Eyebrow>

        <h1 className="text-display-m font-display leading-tight text-fg-primary">
          {t.rich("title", {
            accent: (chunks) => (
              <span className="text-editorial italic">{chunks}</span>
            ),
          })}
        </h1>

        <p className="text-body-l leading-relaxed text-fg-secondary max-w-[44ch]">
          {formattedDate
            ? t.rich("bodyWithDate", {
                date: formattedDate,
                strong: (chunks) => (
                  <strong className="font-semibold text-fg-primary">
                    {chunks}
                  </strong>
                ),
              })
            : t("bodyNoDate")}
        </p>

        <div className="mt-s flex flex-wrap items-center justify-center gap-s">
          <Button
            asChild
            className="h-11 bg-brand text-on-brand font-semibold hover:bg-brand-dim"
          >
            <Link href="/events">{t("ctaPrimary")}</Link>
          </Button>
          <SignOutButton
            label={t("ctaSecondary")}
            errorLabel={tAccount("signOutError")}
            className="h-11"
          />
        </div>

        <div className="mt-xl w-full rounded-l border border-border bg-bg-surface p-l text-left">
          <p className="text-body-s leading-relaxed text-fg-secondary">
            {t.rich("escapeHatch", {
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
      </main>
    </div>
  )
}
