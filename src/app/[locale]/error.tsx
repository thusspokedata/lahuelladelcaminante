"use client"

/**
 * Error boundary austero a nivel `[locale]/`. Fallback de último
 * recurso para errores que ocurren FUERA de los grupos `(public)` y
 * `(protected)/dashboard/**` — esos tienen sus propios `error.tsx`
 * con shell apropiado (Header/Footer y DashboardShell respectivamente).
 *
 * Acá cubre: errores en `(auth)`, `(admin)`, `user-blocked`,
 * `user-pending` y cualquier ruta sin error boundary más cercano.
 * Sin Header/Footer — no podemos asumir qué layout está disponible y
 * un loop de error en el shell sería peor que un fallback austero.
 *
 * Client por contrato Next: recibe `unstable_retry` (Next 16.2+) que
 * re-fetchea el segmento.
 */

import ErrorScreen from "@/components/ui/ErrorScreen"

export interface LocaleErrorProps {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export default function LocaleError({ error, unstable_retry }: LocaleErrorProps) {
  return (
    <main className="min-h-screen flex bg-bg-page text-fg-primary">
      <ErrorScreen
        error={error}
        onRetry={unstable_retry}
        logSource="error.tsx:[locale]"
      />
    </main>
  )
}
