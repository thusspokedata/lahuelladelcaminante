import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function UserBlockedPage() {
  const t = useTranslations("common");
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Cuenta suspendida</h1>
          <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Tu cuenta ha sido suspendida.
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Por motivos de seguridad o cumplimiento de nuestras normas, tu cuenta ha sido
            suspendida. Si crees que se trata de un error, por favor contacta con nuestro equipo de
            soporte.
          </p>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                {t("backToHome")}
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
