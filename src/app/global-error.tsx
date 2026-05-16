"use client"

/**
 * Error boundary GLOBAL — captura errores cuando el layout root
 * (`[locale]/layout.tsx`) explotó y no quedó nada del shell. Es el
 * último recurso antes de la pantalla blanca del browser.
 *
 * Reglas duras:
 *  - Renderiza `<html>` + `<head>` + `<body>` propios (no hay layout
 *    arriba). Incluimos `<meta charSet>` y `<meta name="viewport">`
 *    para que mobile no haga zoom-out y los acentos en español
 *    rendericen bien aunque el browser caiga a un encoding latino.
 *  - **No usa next-intl** (`NextIntlClientProvider` puede haber sido
 *    quien rompió). Strings en castellano hardcoded — locale canónico
 *    del proyecto.
 *  - **No usa `globals.css`** indirectamente vía Tailwind classes con
 *    tokens (`bg-bg-page`, `text-fg-primary`): si el CSS no cargó, los
 *    tokens no resuelven. Usamos `style={}` inline con los hex values
 *    del design system para consistencia visual sin depender de CSS
 *    externo.
 *  - **No usa `<Link>` ni router** de Next: solo `<a href>`.
 *
 * Solo en `development` mostramos el `error.message` + `digest`.
 *
 * Next 16.2+: la prop de re-fetch ahora se llama `unstable_retry`.
 */

import { useEffect } from "react"

export interface GlobalErrorProps {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

export default function GlobalError({ error, unstable_retry }: GlobalErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("[global-error.tsx]", error)
    }
  }, [error])

  const isDev = process.env.NODE_ENV === "development"

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error · La Huella del Caminante</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#15100B",
          color: "#F4ECE0",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "560px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <p
            style={{
              color: "#D43029",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            ALGO SE ROMPIÓ
          </p>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            El camino se enredó por un momento.
          </h1>
          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.5,
              color: "#A89889",
              margin: 0,
            }}
          >
            Recargá la página. Si el problema sigue, escribinos.
          </p>
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              onClick={unstable_retry}
              style={{
                background: "#D43029",
                color: "#FFE6E3",
                border: "none",
                borderRadius: "9999px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- usamos <a> a propósito: cuando este boundary se monta, `<Link>` de Next puede haber explotado junto con el resto del shell. */}
            <a
              href="/"
              style={{
                background: "transparent",
                color: "#F4ECE0",
                border: "1px solid #332618",
                borderRadius: "9999px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Recargar inicio
            </a>
          </div>

          {isDev ? (
            <pre
              style={{
                marginTop: "16px",
                padding: "12px",
                background: "#241B13",
                border: "1px solid #332618",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#A89889",
                textAlign: "left",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {error.digest ? `digest: ${error.digest}\n` : ""}
              {error.message}
            </pre>
          ) : null}
        </div>
      </body>
    </html>
  )
}
