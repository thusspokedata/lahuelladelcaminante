import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin } from "better-auth/plugins"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
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
          // Check if this email has an approved application
          const approvedApplication = await prisma.application.findFirst({
            where: { email: user.email, status: "approved" },
          })

          if (approvedApplication) {
            // Approved applicant: activate as artist immediately
            await prisma.userProfile.create({
              data: { userId: user.id, status: "ACTIVE" },
            })
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "creator" },
            })
          } else {
            // Regular user: active but no artist permissions
            await prisma.userProfile.create({
              data: { userId: user.id, status: "ACTIVE" },
            })
          }
        },
      },
    },
  },
})
