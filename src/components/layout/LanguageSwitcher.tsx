/**
 * LanguageSwitcher — tres pills (`ES · EN · DE`) siempre visibles.
 *
 * Decisión cerrada del PM (handoff §5.3 regla 4): el switcher NUNCA se
 * convierte en dropdown, en ningún breakpoint. En desktop las pills van
 * separadas por `·`; en mobile (prop `compact`) se compactan (font menor,
 * sin separador) pero siguen siendo tres elementos tappables.
 *
 * Click cambia el locale manteniendo la ruta actual via `useRouter.replace`
 * de `@/i18n/navigation` — ese helper preserva el path y solo intercambia
 * el segmento de locale.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT.md` §5.3 + §6.
 */

"use client"

import { useLocale } from "next-intl"
import { useTransition } from "react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"

export interface LanguageSwitcherProps {
  /** En mobile (`compact = true`) las pills usan font menor y se omite
   * el separador `·` entre ellas. */
  compact?: boolean
  className?: string
}

type Locale = (typeof routing.locales)[number]

export default function LanguageSwitcher({
  compact = false,
  className,
}: LanguageSwitcherProps) {
  const activeLocale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function switchTo(next: Locale) {
    if (next === activeLocale) return
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  const pillBase = cn(
    "inline-flex items-center justify-center font-mono uppercase font-semibold",
    "rounded-pill transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
    compact ? "text-mono px-s py-[2px]" : "text-mono px-m py-xs"
  )

  return (
    <div
      className={cn(
        "inline-flex items-center",
        compact ? "gap-xs" : "gap-s",
        className
      )}
      role="group"
      aria-label="Language switcher"
    >
      {routing.locales.map((loc, i) => {
        const isActive = loc === activeLocale
        return (
          <span key={loc} className="inline-flex items-center">
            <button
              type="button"
              onClick={() => switchTo(loc)}
              disabled={isPending}
              aria-pressed={isActive}
              className={cn(
                pillBase,
                isActive
                  ? "bg-bg-surface-2 text-fg-primary"
                  : "bg-transparent text-fg-secondary hover:bg-bg-surface-2 hover:text-fg-primary",
                isPending && "opacity-60 cursor-wait"
              )}
            >
              {loc.toUpperCase()}
            </button>
            {!compact && i < routing.locales.length - 1 && (
              <span
                aria-hidden="true"
                className="ml-s text-fg-tertiary select-none"
              >
                ·
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
