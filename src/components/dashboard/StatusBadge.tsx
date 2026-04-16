import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"

type UserStatus = "PENDING" | "ACTIVE" | "BLOCKED"

interface StatusBadgeProps {
  status: UserStatus
}

const variants: Record<UserStatus, "secondary" | "default" | "destructive"> = {
  PENDING: "secondary",
  ACTIVE: "default",
  BLOCKED: "destructive",
}

const keys: Record<UserStatus, "pending" | "active" | "blocked"> = {
  PENDING: "pending",
  ACTIVE: "active",
  BLOCKED: "blocked",
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations("status")
  return <Badge variant={variants[status]}>{t(keys[status])}</Badge>
}
