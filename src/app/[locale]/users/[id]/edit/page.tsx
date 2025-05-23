import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/lib/db";
import { UserRoleForm } from "./UserRoleForm";
import { UserStatusForm } from "./UserStatusForm";
import { getTranslations } from "next-intl/server";

type Params = Promise<{ id: string }>;

export default async function EditUserPage({ params }: { params: Params }) {
  const { id } = await params;
  // Check if the current user is an administrator
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get the user to edit
  const user = await prisma.user.findUnique({
    where: { id: id },
  });

  // If the user doesn't exist, redirect
  if (!user) {
    redirect("/admin/users");
  }

  // Get translations
  const t = await getTranslations("users.edit");
  const tUsers = await getTranslations("users");

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Link href="/admin/users">
          <Button variant="outline">{t("backToList")}</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User information */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">{t("userInfo")}</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">ID</dt>
              <dd className="text-base">{user.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Clerk ID</dt>
              <dd className="text-base">{user.clerkId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{tUsers("name")}</dt>
              <dd className="text-base">
                {user.firstName
                  ? `${user.firstName} ${user.lastName || ""}`
                  : tUsers("notSpecified")}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{tUsers("email")}</dt>
              <dd className="text-base">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t("registrationDate")}</dt>
              <dd className="text-base">{new Date(user.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t("lastUpdate")}</dt>
              <dd className="text-base">{new Date(user.updatedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        {/* Forms to edit the user */}
        <div className="space-y-6">
          {/* Form to edit the role */}
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">{t("userRole")}</h2>
            <UserRoleForm userId={user.id} currentRole={user.role} />
          </div>

          {/* Form to edit the status */}
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">{t("userStatus")}</h2>
            <UserStatusForm userId={user.id} currentStatus={user.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
