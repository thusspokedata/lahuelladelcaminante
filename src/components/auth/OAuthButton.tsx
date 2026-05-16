"use client"

/**
 * OAuthButton — botón "Continuar con {provider}" para los flows de OAuth
 * en `/sign-in` y `/sign-up`.
 *
 * Client component porque acepta `onClick` (los callers disparan
 * `signIn.social({ provider, callbackURL })` desde ahí). Hoy solo
 * renderiza el glyph de Google; si más adelante se agregan más providers
 * (Apple, GitHub), agregar variantes condicionales del glyph dentro
 * de este componente.
 *
 * Estilo: variant `outline` + `w-full` + altura cómoda para tap target
 * en mobile. El glyph va a la izquierda con `gap-s`; el `Button` de
 * shadcn ya provee `inline-flex items-center gap-2` por default, pero
 * forzamos `justify-center` para alineación visual con el texto.
 */

import { Button } from "@/components/ui/button"
import GoogleGlyph from "./GoogleGlyph"

export interface OAuthButtonProps {
  provider: "google"
  label: string
  onClick: () => void
  disabled?: boolean
}

export default function OAuthButton({
  provider,
  label,
  onClick,
  disabled,
}: OAuthButtonProps) {
  // Por ahora solo Google. Si agregamos más providers, switch acá.
  // Mantener el componente cerrado al `provider` prop permite a TS
  // garantizar exhaustividad cuando se agregue un caso nuevo.
  const glyph = provider === "google" ? <GoogleGlyph /> : null

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full justify-center gap-s text-body font-medium"
      onClick={onClick}
      disabled={disabled}
    >
      {glyph}
      <span>{label}</span>
    </Button>
  )
}
