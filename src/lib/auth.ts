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
            return
          }

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
        },
      },
    },
  },
})
