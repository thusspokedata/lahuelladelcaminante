import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin } from "better-auth/plugins"
import { prisma } from "./prisma"

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
        after: async (user) => {
          // Decisión de producto cerrada: cuenta nace PENDING para que
          // el flow de `/user-pending` se active de verdad. Excepciones:
          //  - Cuenta con Application APPROVED previa (sign-up post
          //    aprobación) → activar y subir a creator inmediatamente.
          //  - Cuenta con `role: admin` (seed manual o creación interna
          //    desde código) → respetar y dejar ACTIVE. Sign-up público
          //    no puede asignar role admin (Better Auth `defaultRole:
          //    "user"` lo bloquea), pero el check defensivo evita
          //    bloquear al primer admin del seed si lo creamos via DB.
          if (user.role === "admin") {
            await prisma.userProfile.create({
              data: { userId: user.id, status: "ACTIVE" },
            })
            return
          }

          const approvedApplication = await prisma.application.findFirst({
            where: { email: user.email, status: "APPROVED" },
          })

          if (approvedApplication) {
            // Cuenta nace ACTIVE + creator solo si ya hubo aprobación
            // previa de su Application — el matching es por email
            // porque Application no tiene FK a User.
            await prisma.userProfile.create({
              data: { userId: user.id, status: "ACTIVE" },
            })
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "creator" },
            })
          } else {
            // Caso default: cuenta nueva sin Application aprobada nace
            // PENDING. El usuario puede browsear el sitio público; al
            // intentar entrar a `/dashboard`, `requireActive()` lo
            // redirige a `/user-pending`. Pasa a ACTIVE cuando admin
            // aprueba una Application con su mismo email (ver
            // `src/app/api/apply/[id]/route.ts`).
            await prisma.userProfile.create({
              data: { userId: user.id, status: "PENDING" },
            })
          }
        },
      },
    },
  },
})
