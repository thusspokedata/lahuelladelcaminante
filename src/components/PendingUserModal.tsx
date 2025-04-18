"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

interface PendingUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PendingUserModal({ open, onOpenChange }: PendingUserModalProps) {
  const router = useRouter();

  const handleClose = () => {
    onOpenChange(false);
    router.push("/");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <DialogTitle>Cuenta Pendiente de Aprobación</DialogTitle>
          <DialogDescription className="text-center">
            Tu cuenta está pendiente de aprobación por un administrador. Podrás acceder al panel de
            control una vez que tu cuenta haya sido aprobada.
          </DialogDescription>
          <div className="text-muted-foreground mt-2 text-center text-sm">
            Si deseas agilizar el proceso, puedes enviar un correo a
            <a href="mailto:info@lahuelladelcaminante.de" className="text-primary ml-1 font-medium">
              info@lahuelladelcaminante.de
            </a>{" "}
            para solicitar la revisión de tu cuenta.
          </div>
        </DialogHeader>
        <DialogFooter className="flex justify-center">
          <Button onClick={handleClose}>Volver al Inicio</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
