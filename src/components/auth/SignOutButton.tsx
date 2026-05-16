"use client"

/**
 * SignOutButton — botón cliente que dispara `signOut()` de Better Auth
 * y navega al home post-logout.
 *
 * Consumido por `/user-pending` y `/user-blocked` (las dos pantallas
 * donde el user logueado necesita una salida visible). Aislamos el
 * trigger en un componente chico para que las pages padre sigan siendo
 * server components — solo este pedazo cruza el boundary client.
 *
 * El redirect post-signOut usa `router.replace("/")` (no `push`) para
 * que el back del browser no traiga al user de vuelta a la pantalla
 * de cuenta suspendida/pendiente. Better Auth limpia la cookie de
 * sesión antes de resolver la promesa, así que para cuando el replace
 * corre el guard de `/` no encuentra session.
 */

import { useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"
import { signOut } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

export interface SignOutButtonProps {
  label: string
  loadingLabel?: string
  /** Mensaje para el toast de error si signOut falla. El caller lo
   * provee i18n-aware (este componente no consume `useTranslations`
   * para mantener su API simple). */
  errorLabel?: string
  variant?: "outline" | "ghost" | "default"
  className?: string
}

export default function SignOutButton({
  label,
  loadingLabel,
  errorLabel,
  variant = "outline",
  className,
}: SignOutButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        await signOut()
        router.replace("/")
      } catch {
        // Si Better Auth falla (network, server down, etc.) el user
        // queda con sesión activa pero esperando feedback. Toast en
        // lugar de inline error para consistencia con SignInForm /
        // SignUpForm (mismo patrón sonner). Fallback a un mensaje
        // genérico si el caller no pasó `errorLabel` — no rompe el
        // botón ni deja al user en limbo silencioso.
        toast.error(errorLabel ?? "Sign out failed. Try again.")
      }
    })
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleClick}
      disabled={isPending}
      className={className}
    >
      {isPending && loadingLabel ? loadingLabel : label}
    </Button>
  )
}
