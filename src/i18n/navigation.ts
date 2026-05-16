/**
 * Helpers de navegación locale-aware de next-intl, atados al `routing` del
 * proyecto. Usar estos en lugar de los de `next/navigation` cuando se quiera:
 *  - Preservar el locale al navegar dentro del mismo idioma (`Link`,
 *    `useRouter` re-exportados acá).
 *  - Cambiar de locale manteniendo la ruta actual (`router.replace(pathname,
 *    { locale: nextLocale })`).
 *  - Leer el pathname **sin** el prefijo `/[locale]` (`usePathname()` de acá).
 *
 * Para navegación que ignora locale (ej. links a `#` o URLs externas), seguir
 * usando `next/link` directamente.
 */

import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
