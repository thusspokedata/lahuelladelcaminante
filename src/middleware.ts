import { clerkMiddleware } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./config";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  // Redirect when accessing the site root
  localePrefix: "always",
});


export default clerkMiddleware((auth, req) => {
  // Execute next-intl middleware before Clerk's middleware
  return intlMiddleware(req);
});

// Configure which routes this middleware will run on
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
