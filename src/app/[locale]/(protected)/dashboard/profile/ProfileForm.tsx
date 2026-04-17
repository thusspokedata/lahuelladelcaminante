"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ProfileFormProps {
  userId: string
  currentName: string
  currentEmail: string
}

export function ProfileForm({ currentName, currentEmail }: ProfileFormProps) {
  const t = useTranslations("dashboard")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const locale = useLocale()

  const [name, setName] = useState(currentName)
  const [email, setEmail] = useState(currentEmail)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingName, setSavingName] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")

  async function handleDeleteAccount() {
    if (deleteConfirm !== "ELIMINAR") return
    setDeletingAccount(true)
    const res = await fetch("/api/users/me", { method: "DELETE" })
    if (!res.ok) {
      setDeletingAccount(false)
      toast.error(tCommon("error"))
      return
    }
    await authClient.signOut()
    router.push(`/${locale}`)
  }

  async function handleSaveName() {
    if (!name.trim() || name === currentName) return
    setSavingName(true)
    const res = await authClient.updateUser({ name })
    setSavingName(false)
    if (res.error) {
      toast.error(res.error.message ?? tCommon("error"))
      return
    }
    toast.success(t("profileNameUpdated"))
    router.refresh()
  }

  async function handleSaveEmail() {
    if (!email.trim() || email === currentEmail) return
    setSavingEmail(true)
    const res = await authClient.changeEmail({ newEmail: email })
    setSavingEmail(false)
    if (res.error) {
      toast.error(res.error.message ?? tCommon("error"))
      return
    }
    toast.success(t("profileEmailUpdated"))
    router.refresh()
  }

  async function handleSavePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) return
    if (newPassword.length < 8) {
      toast.error(t("profilePasswordMin"))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("profilePasswordMismatch"))
      return
    }
    setSavingPassword(true)
    const res = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    })
    setSavingPassword(false)
    if (res.error) {
      toast.error(res.error.message ?? tCommon("error"))
      return
    }
    toast.success(t("profilePasswordUpdated"))
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="space-y-8">
      {/* Name */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
          {t("profileName")}
        </h2>
        <div className="flex gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSaveName} disabled={savingName || name === currentName}>
            {savingName ? tCommon("loading") : tCommon("save")}
          </Button>
        </div>
      </div>

      {/* Email */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
          {t("profileEmail")}
        </h2>
        <div className="flex gap-3">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSaveEmail} disabled={savingEmail || email === currentEmail}>
            {savingEmail ? tCommon("loading") : tCommon("save")}
          </Button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
          {t("profilePassword")}
        </h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>{t("profileCurrentPassword")}</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("profileNewPassword")}</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("profileConfirmPassword")}</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSavePassword}
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="w-full"
          >
            {savingPassword ? tCommon("loading") : t("profilePasswordUpdated")}
          </Button>
        </div>
      </div>
      {/* Delete account */}
      <div className="bg-card border border-destructive/40 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-widest text-destructive">
          {t("profileDeleteAccount")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("profileDeleteWarning")}</p>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">
              {t("profileDeleteConfirmLabel")} <span className="font-mono font-bold text-foreground">ELIMINAR</span>
            </Label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="ELIMINAR"
              className="border-destructive/40 focus-visible:ring-destructive/40"
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deletingAccount || deleteConfirm !== "ELIMINAR"}
            className="w-full"
          >
            {deletingAccount ? tCommon("loading") : t("profileDeleteAccount")}
          </Button>
        </div>
      </div>
    </div>
  )
}
