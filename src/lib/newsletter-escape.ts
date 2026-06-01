/**
 * Escape mínimo para interpolar strings en HTML de email.
 * Mismo patrón que `escapeHtml` en `src/lib/trigger.ts` pero exportado
 * como módulo separado para compartirlo entre trigger.ts y newsletter-emails.ts.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
