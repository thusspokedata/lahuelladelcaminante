import path from "node:path"
import { readFileSync } from "node:fs"
import { defineConfig } from "prisma/config"

function loadEnv() {
  try {
    const content = readFileSync(".env.local", "utf-8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
      if (!process.env[key]) process.env[key] = value
    }
  } catch {}
}

loadEnv()

// Prisma 7: el `url` del datasource vive acá, no en el schema (P1012).
// Preferimos `DIRECT_URL` (endpoint Neon sin pooler) para que el CLI
// (`migrate deploy`, `migrate dev`, `introspect`) no se cuelgue en el
// `pg_advisory_lock` que el pooler no soporta — esto cierra el P1002
// intermitente que veíamos en deploys. Fallback a `DATABASE_URL` para
// entornos que aún no migraron las env vars (dev local sin DIRECT_URL).
//
// El runtime client de la app sigue usando `DATABASE_URL` (pooler) vía
// el adapter PrismaPg en `src/lib/prisma.ts` — independiente de esto.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
})
