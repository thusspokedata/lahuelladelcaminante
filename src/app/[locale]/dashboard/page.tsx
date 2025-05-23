import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/services/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Get translator for server-side text
  const t = await getTranslations({ locale, namespace: "dashboard.mainPage" });
  // Get the current user with information from our DB
  const user = await getCurrentUser();

  // Redirect if user doesn't exist
  if (!user) {
    redirect("/");
  }

  // When users with PENDING or BLOCKED status try to access directly,
  // redirect them to homepage (they should see the modal via our DashboardLink component)
  if (user.status !== "ACTIVE") {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <SignOutButton>
          <Button variant="outline">{t("logout")}</Button>
        </SignOutButton>
      </div>

      <div className="mb-6 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">{t("userInfo")}</h2>
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">{t("name")}</dt>
            <dd className="text-base">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : t("notSpecified")}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">{t("email")}</dt>
            <dd className="text-base">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">{t("role")}</dt>
            <dd className="text-base capitalize">{user.role.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">{t("status")}</dt>
            <dd className="text-base capitalize">{user.status.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">{t("registerDate")}</dt>
            <dd className="text-base">{user.createdAt.toLocaleDateString(locale)}</dd>
          </div>
        </dl>
      </div>

      {/* Role-specific links */}
      <div className="space-y-4">
        {user.role === "ADMIN" && (
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">{t("administration")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link href={`/${locale}/admin/users`}>
                <Button variant="outline" className="h-24 w-full justify-start p-4">
                  <div className="text-left">
                    <div className="font-medium">{t("userManagement")}</div>
                    <div className="mt-1 text-sm text-gray-500">{t("userManagementDesc")}</div>
                  </div>
                </Button>
              </Link>
              <Link href={`/${locale}/admin/events`}>
                <Button variant="outline" className="h-24 w-full justify-start p-4">
                  <div className="text-left">
                    <div className="font-medium">{t("eventsManagement")}</div>
                    <div className="mt-1 text-sm text-gray-500">{t("eventsManagementDesc")}</div>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {user.role === "ADMIN" && (
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">{t("artistManagement")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link href={`/${locale}/dashboard/artist/profile`}>
                <Button variant="outline" className="h-24 w-full justify-start p-4">
                  <div className="text-left">
                    <div className="font-medium">{t("artistProfile")}</div>
                    <div className="mt-1 text-sm text-gray-500">{t("artistProfileDesc")}</div>
                  </div>
                </Button>
              </Link>
              <Link href={`/${locale}/dashboard/artist/events`}>
                <Button variant="outline" className="h-24 w-full justify-start p-4">
                  <div className="text-left">
                    <div className="font-medium">{t("myEvents")}</div>
                    <div className="mt-1 text-sm text-gray-500">{t("myEventsDesc")}</div>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("events")}</h2>
            <Link href={`/${locale}/dashboard/events/create`}>
              <Button>{t("createEvent")}</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={`/${locale}/dashboard/events`}>
              <Button variant="outline" className="h-24 w-full justify-start p-4">
                <div className="text-left">
                  <div className="font-medium">{t("myEvents")}</div>
                  <div className="mt-1 text-sm text-gray-500">{t("viewManageEvents")}</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("artists")}</h2>
            <Link href={`/${locale}/dashboard/artists/create`}>
              <Button>{t("addArtist")}</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={`/${locale}/dashboard/artists`}>
              <Button variant="outline" className="h-24 w-full justify-start p-4">
                <div className="text-left">
                  <div className="font-medium">{t("myArtists")}</div>
                  <div className="mt-1 text-sm text-gray-500">{t("myArtistsDesc")}</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">{t("account")}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={`/${locale}/dashboard/settings`}>
              <Button variant="outline" className="h-24 w-full justify-start p-4">
                <div className="text-left">
                  <div className="font-medium">{t("settings")}</div>
                  <div className="mt-1 text-sm text-gray-500">{t("settingsDesc")}</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
