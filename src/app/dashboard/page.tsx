import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/services/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
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
        <h1 className="text-3xl font-bold">Panel de Control</h1>
        <SignOutButton>
          <Button variant="outline">Cerrar sesión</Button>
        </SignOutButton>
      </div>

      <div className="mb-6 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Información del Usuario</h2>
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Nombre</dt>
            <dd className="text-base">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : "No especificado"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="text-base">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Rol</dt>
            <dd className="text-base capitalize">{user.role.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Estado</dt>
            <dd className="text-base capitalize">{user.status.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha de registro</dt>
            <dd className="text-base">{user.createdAt.toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>

      {/* Role-specific links */}
      <div className="space-y-4">
        {user.role === "ADMIN" && (
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">Administración</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/admin/users">
                <Button variant="outline" className="h-24 w-full justify-start p-4">
                  <div className="text-left">
                    <div className="font-medium">Gestión de Usuarios</div>
                    <div className="mt-1 text-sm text-gray-500">
                      Aprobar, bloquear y asignar roles a usuarios
                    </div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/events">
                <Button variant="outline" className="h-24 w-full justify-start p-4">
                  <div className="text-left">
                    <div className="font-medium">Eventos</div>
                    <div className="mt-1 text-sm text-gray-500">Gestionar y aprobar eventos</div>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {(user.role === "ARTIST" || user.role === "ADMIN") && (
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">Gestión de Artista</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/dashboard/artist/profile">
                <Button variant="outline" className="h-24 w-full justify-start p-4">
                  <div className="text-left">
                    <div className="font-medium">Perfil de Artista</div>
                    <div className="mt-1 text-sm text-gray-500">Gestionar tu perfil de artista</div>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/artist/events">
                <Button variant="outline" className="h-24 w-full justify-start p-4">
                  <div className="text-left">
                    <div className="font-medium">Mis Eventos</div>
                    <div className="mt-1 text-sm text-gray-500">Gestionar tus eventos</div>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Eventos</h2>
            <Link href="/dashboard/events/create">
              <Button>Crear Evento</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/dashboard/events">
              <Button variant="outline" className="h-24 w-full justify-start p-4">
                <div className="text-left">
                  <div className="font-medium">Mis Eventos</div>
                  <div className="mt-1 text-sm text-gray-500">Ver y gestionar tus eventos</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Mi Cuenta</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/dashboard/settings">
              <Button variant="outline" className="h-24 w-full justify-start p-4">
                <div className="text-left">
                  <div className="font-medium">Configuración</div>
                  <div className="mt-1 text-sm text-gray-500">Gestionar preferencias de cuenta</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
