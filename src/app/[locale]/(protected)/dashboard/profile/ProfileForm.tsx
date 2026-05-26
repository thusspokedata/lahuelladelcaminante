"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { CldUploadWidget } from "next-cloudinary"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Image from "next/image"

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

interface ProfileFormProps {
  userId: string
  currentName: string
  currentEmail: string
  currentImage: string | null
  currentBio: string | null
  currentCity: string | null
  currentSocial: {
    instagram?: string
    website?: string
    other?: { label: string; url: string }
  } | null
  currentSlug: string | null
}

export function ProfileForm({
  currentName,
  currentEmail,
  currentImage,
  currentBio,
  currentCity,
  currentSocial,
  currentSlug,
}: ProfileFormProps) {
  const t = useTranslations("dashboard")
  const tPub = useTranslations("dashboard.profilePublic")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const locale = useLocale()

  // Account fields
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

  // Public profile fields
  const [bio, setBio] = useState(currentBio ?? "")
  const [city, setCity] = useState(currentCity ?? "")
  const [instagram, setInstagram] = useState(currentSocial?.instagram ?? "")
  const [website, setWebsite] = useState(currentSocial?.website ?? "")
  const [otherLabel, setOtherLabel] = useState(currentSocial?.other?.label ?? "")
  const [otherUrl, setOtherUrl] = useState(currentSocial?.other?.url ?? "")
  const [slug, setSlug] = useState(currentSlug ?? "")
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [savingBio, setSavingBio] = useState(false)
  const [savingCity, setSavingCity] = useState(false)
  const [savingSocial, setSavingSocial] = useState(false)
  const [savingSlug, setSavingSlug] = useState(false)

  // ── Shared PATCH helper ─────────────────────────────────────────────────
  async function patchProfile(body: Record<string, unknown>): Promise<Response> {
    return fetch("/api/users/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  // ── Avatar ──────────────────────────────────────────────────────────────
  async function handleAvatarUpload(url: string) {
    setSavingAvatar(true)
    const res = await authClient.updateUser({ image: url })
    setSavingAvatar(false)
    if (res.error) {
      toast.error(res.error.message ?? tCommon("error"))
      return
    }
    toast.success(tCommon("save") ?? "Guardado")
    router.refresh()
  }

  // ── Bio ─────────────────────────────────────────────────────────────────
  async function handleSaveBio() {
    setSavingBio(true)
    const res = await patchProfile({ bio: bio.trim() || null })
    setSavingBio(false)
    if (!res.ok) {
      toast.error(tCommon("error"))
      return
    }
    toast.success(tCommon("save") ?? "Guardado")
    router.refresh()
  }

  // ── City ────────────────────────────────────────────────────────────────
  async function handleSaveCity() {
    setSavingCity(true)
    const res = await patchProfile({ city: city.trim() || null })
    setSavingCity(false)
    if (!res.ok) {
      toast.error(tCommon("error"))
      return
    }
    toast.success(tCommon("save") ?? "Guardado")
    router.refresh()
  }

  // ── Social ──────────────────────────────────────────────────────────────
  async function handleSaveSocial() {
    setSavingSocial(true)
    const social: Record<string, unknown> = {}
    if (instagram.trim()) social.instagram = instagram.trim().replace(/^@/, "")
    if (website.trim()) social.website = website.trim()
    if (otherLabel.trim() && otherUrl.trim()) {
      social.other = { label: otherLabel.trim(), url: otherUrl.trim() }
    }
    const res = await patchProfile({
      socialMedia: Object.keys(social).length > 0 ? social : null,
    })
    setSavingSocial(false)
    if (!res.ok) {
      toast.error(tCommon("error"))
      return
    }
    toast.success(tCommon("save") ?? "Guardado")
    router.refresh()
  }

  // ── Slug ────────────────────────────────────────────────────────────────
  async function handleSaveSlug() {
    if (!slug.trim() || slug === currentSlug) return
    setSavingSlug(true)
    const res = await patchProfile({ slug: slug.trim() })
    setSavingSlug(false)
    if (res.status === 409) {
      toast.error(tPub("slugCollision"))
      return
    }
    if (!res.ok) {
      toast.error(tCommon("error"))
      return
    }
    toast.success(tCommon("save") ?? "Guardado")
    router.refresh()
  }

  // ── Account ─────────────────────────────────────────────────────────────
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
      {/* ── AVATAR ─────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
          {tPub("sectionAvatar")}
        </h2>
        <div className="flex items-center gap-4">
          {currentImage ? (
            <Image
              src={currentImage}
              alt=""
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border border-border">
              <span className="text-muted-foreground text-xl font-bold">
                {currentName?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            </div>
          )}
          {UPLOAD_PRESET ? (
            <CldUploadWidget
              uploadPreset={UPLOAD_PRESET}
              options={{ multiple: false, maxFiles: 1, cropping: true }}
              onSuccess={(result) => {
                if (
                  result.info &&
                  typeof result.info === "object" &&
                  "secure_url" in result.info
                ) {
                  const info = result.info as { secure_url: string }
                  void handleAvatarUpload(info.secure_url)
                }
              }}
            >
              {({ open }) => (
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingAvatar}
                  onClick={() => open()}
                >
                  {savingAvatar ? tCommon("loading") : tPub("sectionAvatar")}
                </Button>
              )}
            </CldUploadWidget>
          ) : (
            <p className="text-sm text-muted-foreground">
              Avatar — próximamente (Task follow-up)
            </p>
          )}
        </div>
      </div>

      {/* ── URL PÚBLICA ────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
          {tPub("sectionUrl")}
        </h2>
        {currentSlug ? (
          <p className="text-sm text-muted-foreground">
            /creators/<span className="font-mono text-foreground">{currentSlug}</span>
          </p>
        ) : null}
        <div className="flex gap-3">
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={handleSaveSlug}
            disabled={savingSlug || slug === (currentSlug ?? "") || !slug.trim()}
          >
            {savingSlug ? tCommon("loading") : tPub("save")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{tPub("slugChangeWarning")}</p>
      </div>

      {/* ── BIO ────────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
          {tPub("sectionBio")}
        </h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 500))}
          placeholder={tPub("bioPlaceholder")}
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {tPub("bioCharsLeft", { count: 500 - bio.length })}
          </p>
          <Button
            onClick={handleSaveBio}
            disabled={savingBio || bio === (currentBio ?? "")}
          >
            {savingBio ? tCommon("loading") : tPub("save")}
          </Button>
        </div>
      </div>

      {/* ── CIUDAD ─────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
          {tPub("sectionCity")}
        </h2>
        <div className="flex gap-3">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={tPub("cityPlaceholder")}
            className="flex-1"
          />
          <Button
            onClick={handleSaveCity}
            disabled={savingCity || city === (currentCity ?? "")}
          >
            {savingCity ? tCommon("loading") : tPub("save")}
          </Button>
        </div>
      </div>

      {/* ── REDES ──────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
          {tPub("sectionSocial")}
        </h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>{tPub("instagramHandle")}</Label>
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{tPub("website")}</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{tPub("socialOtherLabel")}</Label>
              <Input value={otherLabel} onChange={(e) => setOtherLabel(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{tPub("socialOtherUrl")}</Label>
              <Input value={otherUrl} onChange={(e) => setOtherUrl(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSaveSocial} disabled={savingSocial} className="w-full">
            {savingSocial ? tCommon("loading") : tPub("save")}
          </Button>
        </div>
      </div>

      {/* ── NAME ───────────────────────────────────────────────────────── */}
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

      {/* ── EMAIL ──────────────────────────────────────────────────────── */}
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

      {/* ── PASSWORD ───────────────────────────────────────────────────── */}
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
            disabled={
              savingPassword || !currentPassword || !newPassword || !confirmPassword
            }
            className="w-full"
          >
            {savingPassword ? tCommon("loading") : t("profilePasswordUpdated")}
          </Button>
        </div>
      </div>

      {/* ── DELETE ACCOUNT ─────────────────────────────────────────────── */}
      <div className="bg-card border border-destructive/40 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-widest text-destructive">
          {t("profileDeleteAccount")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("profileDeleteWarning")}</p>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">
              {t("profileDeleteConfirmLabel")}{" "}
              <span className="font-mono font-bold text-foreground">ELIMINAR</span>
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
