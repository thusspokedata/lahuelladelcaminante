/**
 * Layout austero del grupo `(auth)`. Cubre las páginas `/sign-in` y
 * `/sign-up` (y a futuro `/forgot-password` cuando se implemente).
 *
 * No renderiza Header/Footer globales — auth es un flow enfocado y los
 * elementos de navegación general distraen. En lugar de eso, un mini
 * header de 64px (`h-16`) con:
 *  - `BrandLockup` a la izquierda (linkeado a `/` para que el user pueda
 *    salir del flow sin perderse).
 *  - `LanguageSwitcher` a la derecha (lección del spec de QA — cambio
 *    de idioma debe estar disponible en cada auth screen).
 *
 * Las páginas hijas consumen `AuthShell` para armar la grilla 7:5 interna.
 * `AuthShell` resta los 64px del header del `min-h` via `calc(100vh - 4rem)`
 * — la altura está cementada en los dos lugares: si cambia acá, actualizar
 * también en `AuthShell.tsx`.
 *
 * Spec: `docs/design/DESIGN_HANDOFF_OUTPUT_v2.md` §1.1, §3.2 ("Decisión del
 * dev" — optamos por layout dedicado en vez de variant del Header global,
 * para no agregar surface al componente Header crítico).
 */

import BrandLockup from "@/components/brand/BrandLockup"
import LanguageSwitcher from "@/components/layout/LanguageSwitcher"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-page">
      <header className="flex h-16 items-center justify-between px-l">
        <BrandLockup orientation="horizontal" href="/" />
        <LanguageSwitcher />
      </header>
      <main>{children}</main>
    </div>
  )
}
