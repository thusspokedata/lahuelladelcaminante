import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin } from "better-auth/plugins"
import { prisma } from "./prisma"
import { routing } from "@/i18n/routing"
import {
  triggerSignupWelcome,
  triggerSignupAdminNotification,
} from "./trigger"

/**
 * Detecta el locale del signup a partir de los headers del request que
 * disparó la creación del user. Se usa para enviar el email de bienvenida
 * en el idioma que la persona tenía activo en el sitio.
 *
 *  1. Cookie `NEXT_LOCALE` — la setea el middleware de next-intl y
 *     persiste entre navegaciones. Funciona tanto para el signup
 *     email/password como para el callback de Google OAuth (en OAuth el
 *     request final lo origina nuestro dominio, así que la cookie viaja).
 *  2. Header `Referer` — la página de signup es `/<locale>/sign-up`.
 *     Respaldo para email/password si faltara la cookie; en OAuth el
 *     referer es de Google y no matchea.
 *  3. Fallback: `es` (default del sitio — decisión cerrada del spec).
 */
function detectSignupLocale(headers: Headers | null): string {
  const fallback = routing.defaultLocale
  if (!headers) return fallback
  const supported = routing.locales as readonly string[]

  const cookie = headers.get("cookie")
  if (cookie) {
    // next-intl escribe `NEXT_LOCALE` con el código de locale crudo
    // (`es`/`en`/`de`) — sin URL-encoding, así que no hace falta (ni
    // conviene) `decodeURIComponent`, que podría tirar `URIError` ante
    // un valor de cookie malformado.
    const match = cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
    if (match && supported.includes(match[1])) {
      return match[1]
    }
  }

  const referer = headers.get("referer")
  if (referer) {
    try {
      const segment = new URL(referer).pathname.split("/")[1]?.toLowerCase()
      if (segment && supported.includes(segment)) return segment
    } catch {
      // Referer malformado — ignorar y caer al fallback.
    }
  }

  return fallback
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  trustedOrigins: [
    "https://lahuelladelcaminante.de",
    "https://www.lahuelladelcaminante.de",
    "http://localhost:3000",
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, context) => {
          // Modelo de cuenta (decisión cerrada — ver
          // `feat/public-signup-creator-flow`): `UserProfile.status`
          // representa el estado de la CUENTA, no del rol. Toda cuenta
          // nueva nace `ACTIVE` — el signup es público e inmediato. El
          // "pending" de "todavía no sos creator" no vive acá, vive en
          // `Application.status`.
          //
          // Tres caminos:
          //  - `role: admin` → ACTIVE (seed manual / creación interna).
          //  - Application APPROVED previa por email → ACTIVE + sube
          //    role a `creator` (alguien aplicó, fue aprobado, y recién
          //    después crea la cuenta).
          //  - Default → ACTIVE + role `user`. Navega el sitio público;
          //    si quiere publicar eventos, aplica como creator vía
          //    `/apply` y la `Application` queda PENDING hasta que un
          //    admin la apruebe.
          if (user.role === "admin") {
            await prisma.userProfile.create({
              data: { userId: user.id, status: "ACTIVE" },
            })
          } else {
            const approvedApplication = await prisma.application.findFirst({
              where: { email: user.email, status: "APPROVED" },
            })

            if (approvedApplication) {
              // Cuenta nace ACTIVE + creator porque ya hubo aprobación
              // previa de su Application — el matching es por email
              // porque Application no tiene FK a User.
              //
              // Las dos writes van en una transacción para que el
              // onboarding sea atómico: si falla la promoción a creator
              // tras crear el profile, no quedamos con UserProfile
              // ACTIVE pero role "user" (caso silencioso donde el user
              // tiene panel destrabado pero sin permisos de creación).
              await prisma.$transaction([
                prisma.userProfile.create({
                  data: { userId: user.id, status: "ACTIVE" },
                }),
                prisma.user.update({
                  where: { id: user.id },
                  data: { role: "creator" },
                }),
              ])
            } else {
              // Caso default: cuenta nueva nace ACTIVE + role `user`
              // (heredado del `defaultRole: "user"` de Better Auth). El
              // usuario tiene acceso normal al sitio público. Al intentar
              // entrar a `/dashboard`, el layout le muestra la pantalla
              // intermedia de creator-gate (`CreatorGate`) en lugar del
              // panel — desde ahí puede aplicar como creator.
              await prisma.userProfile.create({
                data: { userId: user.id, status: "ACTIVE" },
              })
            }
          }

          // Emails de signup — bienvenida al user (en su idioma) + aviso
          // interno al admin. Fire-and-forget: el `.catch` evita que una
          // falla de Resend tumbe la creación de la cuenta, y no se
          // `await`-ean para no sumar latencia al signup. El server es un
          // proceso Node persistente (PM2): las promesas pendientes
          // terminan aunque el handler ya haya respondido.
          //
          // Se envían para TODO signup, incluido el camino creator
          // (Application aprobada) y el seed de admin — el spec pide "uno
          // por cada signup". El nudge "aplicá como creator" del email de
          // bienvenida es info inocua incluso para quien ya es creator.
          const locale = detectSignupLocale(context?.request?.headers ?? null)
          triggerSignupWelcome({
            email: user.email,
            name: user.name,
            locale,
          }).catch(() => {
            // Breadcrumb sin PII para los logs de PM2 — el signup nunca
            // debe fallar por un problema de envío de email.
            console.error("signup_welcome_email_failed")
          })
          triggerSignupAdminNotification({
            email: user.email,
            name: user.name,
            locale,
            createdAt: user.createdAt,
          }).catch(() => {
            console.error("signup_admin_email_failed")
          })
        },
      },
    },
  },
})
