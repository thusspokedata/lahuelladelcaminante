"use client";

import { useState } from "react";
import { UserStatus } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { updateUserStatus } from "@/services/auth";
import { useRouter } from "next/navigation";

interface UserStatusFormProps {
  userId: string;
  currentStatus: UserStatus;
}

export function UserStatusForm({ userId, currentStatus }: UserStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<UserStatus>(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle status change
  const handleStatusChange = (newStatus: UserStatus) => {
    setStatus(newStatus);
  };

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === currentStatus) {
      return; // No changes to save
    }

    setIsSubmitting(true);

    try {
      await updateUserStatus(userId, status);
      router.refresh(); // Refresh the page to show changes
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      alert("Ocurrió un error al actualizar el estado. Por favor, inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-col space-y-2">
          <StatusOption
            status="ACTIVE"
            currentStatus={status}
            onChange={handleStatusChange}
            label="Activo"
            description="Usuario con acceso completo al sistema"
          />
          <StatusOption
            status="PENDING"
            currentStatus={status}
            onChange={handleStatusChange}
            label="Pendiente"
            description="Usuario esperando aprobación"
          />
          <StatusOption
            status="BLOCKED"
            currentStatus={status}
            onChange={handleStatusChange}
            label="Bloqueado"
            description="Usuario sin acceso al sistema"
          />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting || status === currentStatus} className="w-full">
        {isSubmitting ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}

// Component for each status option
function StatusOption({
  status,
  currentStatus,
  onChange,
  label,
  description,
}: {
  status: UserStatus;
  currentStatus: UserStatus;
  onChange: (status: UserStatus) => void;
  label: string;
  description: string;
}) {
  const isSelected = status === currentStatus;

  // Different colors based on status
  let colorClass = "";
  switch (status) {
    case "ACTIVE":
      colorClass = "border-green-500 bg-green-50";
      break;
    case "PENDING":
      colorClass = "border-yellow-500 bg-yellow-50";
      break;
    case "BLOCKED":
      colorClass = "border-red-500 bg-red-50";
      break;
  }

  return (
    <div
      className={`cursor-pointer rounded-lg border p-4 ${
        isSelected ? colorClass : "border-gray-200"
      }`}
      onClick={() => onChange(status)}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{label}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full border">
          {isSelected && (
            <div
              className={`h-3 w-3 rounded-full ${
                status === "ACTIVE"
                  ? "bg-green-500"
                  : status === "PENDING"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
