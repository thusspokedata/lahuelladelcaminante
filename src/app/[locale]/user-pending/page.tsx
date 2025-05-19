import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UserPendingPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Cuenta pendiente de aprobación
          </h1>
          <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Tu cuenta está pendiente de revisión por parte de nuestro equipo.
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Como parte de nuestro proceso de verificación, todos los usuarios nuevos deben ser
            aprobados manualmente. Esto nos ayuda a mantener la calidad de nuestra comunidad.
          </p>
          <p className="text-sm text-gray-500">
            Te notificaremos por correo electrónico cuando tu cuenta sea aprobada.
          </p>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Volver al inicio
              </Button>
            </Link>
            <SignOutButton>
              <Button variant="default" className="w-full sm:w-auto">
                Cerrar sesión
              </Button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  );
}
