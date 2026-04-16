import { betterFetch } from "@better-fetch/fetch"
import { NextResponse, type NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

interface SessionResponse {
  session: {
    id: string
    userId: string
    expiresAt: string
  }
  user: {
    id: string
    email: string
    role: string
  }
}

const intlMiddleware = createIntlMiddleware(routing)

const PROTECTED_PATHS = ["/dashboard"]
const ADMIN_PATHS = ["/admin"]

export async function proxy(request: NextRequest) {
  const response = intlMiddleware(request)

  const { pathname } = request.nextUrl
  const locale = pathname.split("/")[1] || "es"
  const pathWithoutLocale = "/" + pathname.split("/").slice(2).join("/")

  const isProtected = PROTECTED_PATHS.some((p) => pathWithoutLocale.startsWith(p))
  const isAdmin = ADMIN_PATHS.some((p) => pathWithoutLocale.startsWith(p))

  if (isProtected || isAdmin) {
    const { data: session } = await betterFetch<SessionResponse>(
      "/api/auth/get-session",
      {
        baseURL: request.nextUrl.origin,
        headers: { cookie: request.headers.get("cookie") ?? "" },
      }
    )

    if (!session) {
      return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url))
    }

    if (isAdmin && session.user.role !== "admin") {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
}
