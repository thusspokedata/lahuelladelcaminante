import path from "node:path"
import { readFileSync } from "node:fs"
import { defineConfig } from "prisma/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// Cargar .env.local manualmente
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

const DATABASE_URL = process.env.DATABASE_URL!

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: DATABASE_URL,
  },
  migrate: {
    async adapter() {
      const pool = new Pool({ connectionString: DATABASE_URL })
      return new PrismaPg(pool)
    },
  },
})
