import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllUsers, getCurrentUser, updateUserStatus } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { UserRole, UserStatus } from "@/generated/prisma";

// Component to manage users
export default async function AdminUsersPage() {
  // Check that the current user is an admin
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get all users
  const users = await getAllUsers();

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Link href="/dashboard">
          <Button variant="outline">Volver al Dashboard</Button>
        </Link>
      </div>

      {/* User table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Nombre
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Rol
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Estado
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Registro
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                    {user.firstName
                      ? `${user.firstName} ${user.lastName || ""}`
                      : "No especificado"}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    <UserRoleBadge role={user.role as UserRole} />
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    <UserStatusBadge status={user.status as UserStatus} />
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Link href={`/admin/users/${user.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      {user.status === "PENDING" && (
                        <form
                          action={async () => {
                            "use server";
                            await updateUserStatus(user.id, "ACTIVE");
                          }}
                        >
                          <Button variant="default" size="sm" type="submit">
                            Aprobar
                          </Button>
                        </form>
                      )}
                      {user.status === "ACTIVE" && (
                        <form
                          action={async () => {
                            "use server";
                            await updateUserStatus(user.id, "BLOCKED");
                          }}
                        >
                          <Button variant="destructive" size="sm" type="submit">
                            Bloquear
                          </Button>
                        </form>
                      )}
                      {user.status === "BLOCKED" && (
                        <form
                          action={async () => {
                            "use server";
                            await updateUserStatus(user.id, "ACTIVE");
                          }}
                        >
                          <Button variant="default" size="sm" type="submit">
                            Desbloquear
                          </Button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Component to display role with a colorful badge
function UserRoleBadge({ role }: { role: UserRole }) {
  let badgeClass = "inline-flex rounded-full px-2 text-xs font-semibold leading-5 ";

  switch (role) {
    case "ADMIN":
      badgeClass += "bg-purple-100 text-purple-800";
      break;
    case "ARTIST":
      badgeClass += "bg-blue-100 text-blue-800";
      break;
    case "USER":
      badgeClass += "bg-green-100 text-green-800";
      break;
    default:
      badgeClass += "bg-gray-100 text-gray-800";
  }

  return <span className={badgeClass}>{role}</span>;
}

// Component to display status with a colorful badge
function UserStatusBadge({ status }: { status: UserStatus }) {
  let badgeClass = "inline-flex rounded-full px-2 text-xs font-semibold leading-5 ";

  switch (status) {
    case "ACTIVE":
      badgeClass += "bg-green-100 text-green-800";
      break;
    case "PENDING":
      badgeClass += "bg-yellow-100 text-yellow-800";
      break;
    case "BLOCKED":
      badgeClass += "bg-red-100 text-red-800";
      break;
    default:
      badgeClass += "bg-gray-100 text-gray-800";
  }

  return <span className={badgeClass}>{status}</span>;
}
