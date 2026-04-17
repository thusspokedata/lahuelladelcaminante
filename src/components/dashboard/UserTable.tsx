"use client"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { StatusBadge } from "./StatusBadge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { UserWithProfile } from "@/services/users"

interface UserTableProps {
  users: UserWithProfile[]
}

export function UserTable({ users }: UserTableProps) {
  const t = useTranslations("admin")
  const tCommon = useTranslations("common")
  const router = useRouter()

  async function updateStatus(id: string, status: "ACTIVE" | "BLOCKED" | "PENDING") {
    const res = await fetch(`/api/users/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })

    if (!res.ok) {
      toast.error(tCommon("error"))
      return
    }

    toast.success(t("statusUpdated"))
    router.refresh()
  }

  async function updateRole(id: string, role: string) {
    const res = await fetch(`/api/users/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })

    if (!res.ok) {
      toast.error(tCommon("error"))
      return
    }

    toast.success(t("roleUpdated"))
    router.refresh()
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("colName")}</TableHead>
          <TableHead>{t("colEmail")}</TableHead>
          <TableHead>{t("colRole")}</TableHead>
          <TableHead>{t("colStatus")}</TableHead>
          <TableHead>{t("colActions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
            <TableCell className="capitalize text-sm">{user.role}</TableCell>
            <TableCell>
              {user.profile && <StatusBadge status={user.profile.status} />}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {user.profile?.status === "PENDING" && (
                  <Button size="sm" onClick={() => updateStatus(user.id, "ACTIVE")}>
                    {t("approve")}
                  </Button>
                )}
                {user.role !== "admin" && user.profile?.status !== "BLOCKED" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(user.id, "BLOCKED")}
                  >
                    {t("block")}
                  </Button>
                )}
                {user.role !== "admin" && user.profile?.status === "BLOCKED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(user.id, "ACTIVE")}
                  >
                    {t("activate")}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent transition-colors">
                    {t("changeRole")}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => updateRole(user.id, "user")}>User</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateRole(user.id, "creator")}>Creator</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateRole(user.id, "admin")}>Admin</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
