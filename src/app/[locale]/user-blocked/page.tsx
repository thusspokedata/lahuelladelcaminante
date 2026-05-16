/**
 * `/[locale]/user-blocked` — pantalla mostrada cuando un user logueado
 * tiene `UserProfile.status === "BLOCKED"`. Disparada por `requireActive`
 * (`src/services/auth.ts`) que redirige acá antes de servir cualquier
 * ruta protegida.
 *
 * Rediseño del handoff v2 §1.5. Estado terminal — el copy es directo
 * pero no agresivo: explica el bloqueo + lista qué SIGUE funcionando
 * para que el user no asuma "perdí todo el sitio". Decisión cerrada de
 * producto: distinguir "bloqueado del panel creator" de "bloqueado del
 * sitio entero" reduce frustración y mantiene al user en lo público.
 *
 * Guard: si no hay session, redirect a `/sign-in` (mismo patrón que
 * /user-pending — la URL no debería mostrar contenido a anónimos).
 *
 * CTA primario "Escribirnos →" linkea a `/contact` (existe en main
 * desde PR #20) — es la única acción que el user puede tomar para
 * resolver el bloqueo.
 */

import { getTranslations, setRequestLocale } from "next-intl/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/services/auth"
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
  const t = await getTranslations({ locale, namespace: "account.blocked" })
  return { title: t("metaTitle") }
}

/** Items de "qué sigue funcionando". Keys i18n nombradas (no array)
 * para que next-intl pueda type-checar cada string individualmente.
 * Si se agrega/quita un item, actualizar acá Y en los 3 messages.* . */
const STILL_WORKS_KEYS = ["canSee", "canBrowse", "cannot"] as const

export default async function UserBlockedPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const user = await getCurrentUser()
  if (!user) {
    redirect(`/${locale}/sign-in`)
  }

  const t = await getTranslations({ locale, namespace: "account.blocked" })
  const tAccount = await getTranslations({ locale, namespace: "account" })

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="flex h-16 items-center px-l">
        <BrandLockup orientation="horizontal" href="/" />
      </header>

      <main className="mx-auto flex max-w-[560px] flex-col items-center gap-l px-l py-2xl text-center">
        <StatusHero variant="blocked" />

        <Eyebrow accent="brand" as="p">
          {t("eyebrow")}
        </Eyebrow>

        <h1 className="text-display-m font-display leading-tight text-fg-primary">
          {t("title")}
        </h1>

        <p className="text-body-l leading-relaxed text-fg-secondary max-w-[44ch]">
          {t("body")}
        </p>

        <div className="mt-s flex flex-wrap items-center justify-center gap-s">
          <Button
            asChild
            className="h-11 bg-brand text-on-brand font-semibold hover:bg-brand-dim"
          >
            <Link href="/contact">{t("ctaContact")}</Link>
          </Button>
          <SignOutButton
            label={t("ctaLogout")}
            errorLabel={tAccount("signOutError")}
            className="h-11"
          />
        </div>

        {/* Bloque "qué sigue funcionando" — surface elevada, alineado
            izquierda para que la lista se lea como tal. Es lo que
            distingue "bloqueado del panel" de "bloqueado del sitio
            entero" (handoff §1.5). */}
        <div className="mt-xl w-full rounded-l border border-border bg-bg-surface p-l text-left">
          <p className="font-mono text-eyebrow uppercase text-fg-secondary">
            {t("stillWorksTitle")}
          </p>
          <ul className="mt-m flex flex-col gap-s">
            {STILL_WORKS_KEYS.map((key) => (
              <li
                key={key}
                className="flex items-start gap-s text-body-s leading-relaxed text-fg-secondary"
              >
                <span
                  aria-hidden={true}
                  className="mt-[8px] inline-block h-1 w-1 shrink-0 rounded-full bg-fg-tertiary"
                />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
