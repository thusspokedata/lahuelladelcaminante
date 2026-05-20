/**
 * Footer — server component, 4 columnas en desktop, stacked en mobile.
 *
 * Estructura por columnas:
 *  1. Marca: BrandLockup vertical + tagline.
 *  2. EXPLORAR: links públicos (Eventos, Artistas, Esta semana).
 *  3. PARA VOS: aplicar como creator, sign-in.
 *  4. COMUNIDAD: Instagram, newsletter (placeholder), link a /contact.
 *
 * **`mailto:info@lahuelladelcaminante.de` removido**: el email expuesto
 * era invitación abierta a scrapers. Reemplazado por link a `/contact`
 * con form (decisión de producto, PR 8.5).
 *
 * Debajo de las columnas, línea separadora con copyright a la izquierda y
 * links a las páginas legales `/impressum` y `/datenschutz` a la derecha
 * (obligatorios por ley alemana, visibles desde todas las páginas).
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §3 + §6.
 */

import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import BrandLockup from "@/components/brand/BrandLockup"
import Eyebrow from "@/components/ui/Eyebrow"

export async function Footer() {
  const t = await getTranslations("footer")
  const tNav = await getTranslations("nav")
  const year = new Date().getFullYear()

  return (
    <footer
      className="border-t border-border bg-bg-page mt-auto"
      style={{
        paddingTop: "var(--spacing-2xl)",
        paddingBottom: "var(--spacing-xl)",
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: "var(--layout-max-w)",
          paddingLeft: "var(--layout-gutter)",
          paddingRight: "var(--layout-gutter)",
        }}
      >
        <div className="grid grid-cols-1 gap-xl lg:grid-cols-4 lg:gap-l">
          {/* Columna 1 — Marca */}
          <div className="flex flex-col items-start gap-m">
            <BrandLockup orientation="vertical" />
            <p className="text-body-s text-fg-secondary leading-relaxed max-w-[28ch]">
              {t("tagline")}
            </p>
          </div>

          {/* Columna 2 — EXPLORAR */}
          <FooterColumn eyebrow={t("explore")}>
            <FooterLink href="/events">{tNav("events")}</FooterLink>
            <FooterLink href="/artists">{tNav("artists")}</FooterLink>
            <FooterLink href="/events#esta-semana">
              {tNav("thisWeek")}
            </FooterLink>
          </FooterColumn>

          {/* Columna 3 — PARA VOS */}
          <FooterColumn eyebrow={t("forYou")}>
            <FooterLink href="/apply">{t("apply")}</FooterLink>
            <FooterLink href="/sign-in">{tNav("signIn")}</FooterLink>
          </FooterColumn>

          {/* Columna 4 — COMUNIDAD */}
          <FooterColumn eyebrow={t("community")}>
            <FooterLink
              href="https://www.instagram.com/lahuelladelcaminante/"
              external
            >
              Instagram
            </FooterLink>
            {/* TODO: replace `#` with real newsletter signup once flow exists. */}
            <FooterLink href="#" external>
              {t("newsletter")}
            </FooterLink>
            <FooterLink href="/contact">{t("contact")}</FooterLink>
          </FooterColumn>
        </div>

        {/* Línea inferior: copyright + legal */}
        <div
          className={cn(
            "border-t border-border mt-2xl pt-l",
            "flex flex-col gap-s sm:flex-row sm:items-center sm:justify-between"
          )}
        >
          <p className="text-caption text-fg-tertiary">
            {t("copyright", { year })}
          </p>
          <div className="flex items-center gap-l">
            <Link
              href="/impressum"
              className="text-caption text-fg-tertiary hover:text-fg-primary transition-colors duration-200 ease-out"
            >
              {t("impressum")}
            </Link>
            <Link
              href="/datenschutz"
              className="text-caption text-fg-tertiary hover:text-fg-primary transition-colors duration-200 ease-out"
            >
              {t("datenschutz")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

interface FooterColumnProps {
  eyebrow: string
  children: React.ReactNode
}

function FooterColumn({ eyebrow, children }: FooterColumnProps) {
  return (
    <div className="flex flex-col gap-m">
      <Eyebrow as="p">{eyebrow}</Eyebrow>
      <ul className="flex flex-col gap-s">{children}</ul>
    </div>
  )
}

interface FooterLinkProps {
  href: string
  children: React.ReactNode
  /** Si es link externo o mailto: abre en nueva pestaña con `noopener
   * noreferrer`. Los links internos usan el `Link` locale-aware de
   * `@/i18n/navigation`. */
  external?: boolean
}

function FooterLink({ href, children, external = false }: FooterLinkProps) {
  const className =
    "text-body-s text-fg-secondary hover:text-fg-primary transition-colors duration-200 ease-out"

  if (external) {
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {children}
        </a>
      </li>
    )
  }

  return (
    <li>
      <Link href={href} className={className}>
        {children}
      </Link>
    </li>
  )
}
