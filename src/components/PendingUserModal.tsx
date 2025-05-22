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
import { useEffect } from "react";
import { useTranslations } from "next-intl";

interface PendingUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PendingUserModal({ open, onOpenChange }: PendingUserModalProps) {
  const t = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const router = useRouter();

  // Log para depuración
  useEffect(() => {
    if (open) {
      console.log("PendingUserModal is now open");
    }
  }, [open]);

  const handleClose = () => {
    console.log("Closing modal and redirecting to home");
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
          <DialogTitle>{tDashboard("pendingTitle")}</DialogTitle>
          <DialogDescription className="text-center">
            {tDashboard("pendingDescription")}
          </DialogDescription>
          <div className="text-muted-foreground mt-2 text-center text-sm">
            {tDashboard("pendingContactInfo")}
            <a href="mailto:info@lahuelladelcaminante.de" className="text-primary ml-1 font-medium">
              info@lahuelladelcaminante.de
            </a>{" "}
            {tDashboard("pendingContactPurpose")}
          </div>
        </DialogHeader>
        <DialogFooter className="flex justify-center">
          <Button onClick={handleClose}>{t("backToHome")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
