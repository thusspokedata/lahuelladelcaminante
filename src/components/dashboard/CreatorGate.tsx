/**
 * CreatorGate — pantalla intermedia que ve un usuario con `role: user`
 * al intentar entrar a `/dashboard`.
 *
 * Desde el cambio de modelo (`feat/public-signup-creator-flow`), una
 * cuenta nueva nace `ACTIVE` + `role: user` — navega el sitio público
 * pero NO accede al panel creator. Cuando intenta entrar a `/dashboard`,
 * el `DashboardLayout` renderiza este componente en lugar del
 * `DashboardShell`.
 *
 * Tres sub-estados según la `Application` del usuario (matcheada por
 * email — `Application` no tiene FK a `User`):
 *  1. Sin Application → "tu cuenta todavía no es de creator" + CTA aplicar.
 *  2. Application PENDING → pantalla de "en revisión" (mismo patrón
 *     visual que `/user-pending`, reusa `StatusHero` + copy
 *     `account.pending.*`).
 *  3. Application REJECTED → "tu solicitud no fue aprobada" + CTA
 *     volver a aplicar (decisión cerrada: se puede re-aplicar).
 *
 * El caso `APPROVED` no debería llegar acá (el user ya sería `creator`).
 * Si llega — approve a medias, role no bumpeado — se trata como
 * sub-estado 2 ("esperá") para no mostrar algo roto.
 *
 * Server component — hace el query directo, sin estado. Solo el
 * `SignOutButton` del sub-estado 2 cruza a client.
 */

import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { prisma } from "@/lib/prisma"
import BrandLockup from "@/components/brand/BrandLockup"
import StatusHero from "@/components/auth/StatusHero"
import SignOutButton from "@/components/auth/SignOutButton"
import Eyebrow from "@/components/ui/Eyebrow"
import { Button } from "@/components/ui/button"

export interface CreatorGateProps {
  locale: string
  /** Email de la cuenta logueada — usado para matchear la `Application`. */
  userEmail: string
}

/** Formato amigable de fecha. ES: `15 de mayo` · EN: `May 15` ·
 * DE: `15. Mai`. Mismo formato que `/user-pending`. */
function formatApplicationDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
  }).format(date)
}

/** Shell mínimo compartido por los 3 sub-estados: header austero con
 * BrandLockup + main centrado. Sin Header global ni DashboardShell —
 * el user acá no debería navegar nada salvo las CTAs del sub-estado. */
function GateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-page">
      <header className="flex h-16 items-center px-l">
        <BrandLockup orientation="horizontal" href="/" />
      </header>
      <main className="mx-auto flex max-w-[560px] flex-col items-center gap-l px-l py-2xl text-center">
        {children}
      </main>
    </div>
  )
}

export default async function CreatorGate({
  locale,
  userEmail,
}: CreatorGateProps) {
  // Application más reciente del user (puede haber aplicado más de una
  // vez). `select` acotado — solo necesitamos status + fecha.
  const application = await prisma.application.findFirst({
    where: { email: userEmail },
    orderBy: { createdAt: "desc" },
    select: { status: true, createdAt: true },
  })

  // ── Sub-estado 2 — Application PENDING (o APPROVED a medias) ──────────
  // Reusa el patrón visual de `/user-pending` + el copy `account.pending.*`.
  if (
    application &&
    (application.status === "PENDING" || application.status === "APPROVED")
  ) {
    const t = await getTranslations({ locale, namespace: "account.pending" })
    const tAccount = await getTranslations({ locale, namespace: "account" })
    const formattedDate = formatApplicationDate(
      application.createdAt,
      locale
    )

    return (
      <GateShell>
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
          {t.rich("bodyWithDate", {
            date: formattedDate,
            strong: (chunks) => (
              <strong className="font-semibold text-fg-primary">
                {chunks}
              </strong>
            ),
          })}
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
      </GateShell>
    )
  }

  const t = await getTranslations({ locale, namespace: "account.creatorGate" })

  // ── Sub-estado 3 — Application REJECTED ──────────────────────────────
  if (application && application.status === "REJECTED") {
    return (
      <GateShell>
        <Eyebrow accent="brand" as="p">
          {t("rejected.eyebrow")}
        </Eyebrow>
        <h1 className="text-display-m font-display leading-tight text-fg-primary">
          {t("rejected.title")}
        </h1>
        <p className="text-body-l leading-relaxed text-fg-secondary max-w-[44ch]">
          {t("rejected.body")}
        </p>
        <div className="mt-s flex flex-wrap items-center justify-center gap-s">
          <Button
            asChild
            className="h-11 bg-brand text-on-brand font-semibold hover:bg-brand-dim"
          >
            <Link href="/apply">{t("rejected.ctaReapply")}</Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/contact">{t("rejected.ctaContact")}</Link>
          </Button>
        </div>
      </GateShell>
    )
  }

  // ── Sub-estado 1 — nunca aplicó (no hay Application) ─────────────────
  return (
    <GateShell>
      <Eyebrow accent="brand" as="p">
        {t("notCreator.eyebrow")}
      </Eyebrow>
      <h1 className="text-display-m font-display leading-tight text-fg-primary">
        {t("notCreator.title")}
      </h1>
      <p className="text-body-l leading-relaxed text-fg-secondary max-w-[44ch]">
        {t("notCreator.body")}
      </p>
      <div className="mt-s flex flex-wrap items-center justify-center gap-s">
        <Button
          asChild
          className="h-11 bg-brand text-on-brand font-semibold hover:bg-brand-dim"
        >
          <Link href="/apply">{t("notCreator.ctaApply")}</Link>
        </Button>
        <Button asChild variant="outline" className="h-11">
          <Link href="/">{t("notCreator.ctaHome")}</Link>
        </Button>
      </div>
    </GateShell>
  )
}
