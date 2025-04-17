"use client";

import { useState } from "react";
import { UserRole } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { updateUserRole } from "@/services/auth";
import { useRouter } from "next/navigation";

interface UserRoleFormProps {
  userId: string;
  currentRole: UserRole;
}

export function UserRoleForm({ userId, currentRole }: UserRoleFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejar el cambio de rol
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
  };

  // Enviar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === currentRole) {
      return; // No hay cambios que guardar
    }

    setIsSubmitting(true);

    try {
      await updateUserRole(userId, role);
      router.refresh(); // Actualizar la página para mostrar los cambios
    } catch (error) {
      console.error("Error al actualizar el rol:", error);
      alert("Ocurrió un error al actualizar el rol. Por favor, inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-col space-y-2">
          <RoleOption
            role="USER"
            currentRole={role}
            onChange={handleRoleChange}
            label="Usuario"
            description="Acceso básico a la plataforma"
          />
          <RoleOption
            role="ARTIST"
            currentRole={role}
            onChange={handleRoleChange}
            label="Artista"
            description="Puede crear y gestionar perfiles de artista y eventos"
          />
          <RoleOption
            role="ADMIN"
            currentRole={role}
            onChange={handleRoleChange}
            label="Administrador"
            description="Acceso completo a todas las funcionalidades"
          />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting || role === currentRole} className="w-full">
        {isSubmitting ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}

// Componente para cada opción de rol
function RoleOption({
  role,
  currentRole,
  onChange,
  label,
  description,
}: {
  role: UserRole;
  currentRole: UserRole;
  onChange: (role: UserRole) => void;
  label: string;
  description: string;
}) {
  const isSelected = role === currentRole;

  return (
    <div
      className={`cursor-pointer rounded-lg border p-4 ${
        isSelected ? "border-primary bg-primary/5" : "border-gray-200"
      }`}
      onClick={() => onChange(role)}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{label}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-full border">
          {isSelected && <div className="bg-primary h-3 w-3 rounded-full" />}
        </div>
      </div>
    </div>
  );
}
