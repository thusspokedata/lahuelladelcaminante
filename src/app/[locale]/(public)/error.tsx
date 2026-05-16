"use client"

/**
 * Error boundary del segmento público. Aplica a errores en pages bajo
 * `(public)/**` (home, listados, detalles, contact, etc.).
 *
 * Next.js mantiene el layout padre (`(public)/layout.tsx`, que renderiza
 * Header + main + Footer) montado mientras este boundary reemplaza el
 * page que falló. Por eso acá NO importamos Header/Footer — ya están
 * visibles arriba.
 *
 * Client por contrato Next: recibe `unstable_retry` (Next 16.2+) que
 * re-fetchea el segmento.
 */

import ErrorScreen from "@/components/ui/ErrorScreen"

export interface PublicErrorProps {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export default function PublicError({ error, unstable_retry }: PublicErrorProps) {
  return (
    <ErrorScreen
      error={error}
      onRetry={unstable_retry}
      logSource="error.tsx:(public)"
    />
  )
}
