import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

/**
 * Creates a pathname for the same page but in a different locale
 */
export function createSharedPathnameLinks(
  pathname: string,
  currentLocale: string,
  targetLocale: string
) {
  // Extract path sections and handle possible nested locale patterns
  const segments = pathname.split("/").filter(Boolean);

  // Remove any locale segments that might be present
  const pathWithoutLocales = segments
    .filter((segment) => !["es", "en", "de"].includes(segment))
    .join("/");

  // Create new path with target locale
  return `/${targetLocale}${pathWithoutLocales ? `/${pathWithoutLocales}` : ""}`;
}
