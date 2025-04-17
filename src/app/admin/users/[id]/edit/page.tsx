import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser, updateUserRole, updateUserStatus } from "@/services/auth";
import { db } from "@/lib/db";
import { UserRoleForm } from "./UserRoleForm";
import { UserStatusForm } from "./UserStatusForm";

// Props para la página
interface EditUserPageProps {
  params: {
    id: string;
  };
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  // Verificar que el usuario actual es un administrador
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Obtener el usuario a editar
  const user = await db.user.findUnique({
    where: { id: params.id },
  });

  // Si el usuario no existe, redirigir
  if (!user) {
    redirect("/admin/users");
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Editar Usuario</h1>
        <Link href="/admin/users">
          <Button variant="outline">Volver a la lista</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información del usuario */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Información del Usuario</h2>
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
              <dt className="text-sm font-medium text-gray-500">Nombre</dt>
              <dd className="text-base">{user.name || "No especificado"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-base">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
              <dd className="text-base">{new Date(user.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Última actualización</dt>
              <dd className="text-base">{new Date(user.updatedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        {/* Formularios para editar el usuario */}
        <div className="space-y-6">
          {/* Formulario para editar el rol */}
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">Rol de Usuario</h2>
            <UserRoleForm userId={user.id} currentRole={user.role} />
          </div>

          {/* Formulario para editar el estado */}
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">Estado de Usuario</h2>
            <UserStatusForm userId={user.id} currentStatus={user.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
