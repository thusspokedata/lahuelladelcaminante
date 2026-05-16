"use client"

/**
 * Error boundary del dashboard. Cuando una page bajo `/dashboard/**`
 * falla, este boundary reemplaza el `{children}` que provee
 * `dashboard/layout.tsx` al `DashboardShell` — el sidebar + tab bar
 * mobile quedan intactos para que el creator no pierda la nav.
 *
 * No incluye Header/Footer ni el shell propios (los provee el layout
 * padre que sigue montado).
 *
 * Client por contrato Next: recibe `unstable_retry` (Next 16.2+).
 */

import ErrorScreen from "@/components/ui/ErrorScreen"

export interface DashboardErrorProps {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export default function DashboardError({
  error,
  unstable_retry,
}: DashboardErrorProps) {
  return (
    <ErrorScreen
      error={error}
      onRetry={unstable_retry}
      logSource="error.tsx:(protected)/dashboard"
    />
  )
}
