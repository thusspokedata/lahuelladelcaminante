"use client"

/**
 * SignInForm — form client de `/sign-in`. Único método de auth:
 * email/password (Better Auth). El login con Google OAuth se removió —
 * ver `chore/remove-google-oauth`. Maneja:
 *  - Validación cliente con zod (`signInSchema`) via react-hook-form.
 *  - Email/password via Better Auth `signIn.email`. En éxito navega a la
 *    ruta `returnTo` si la persona llegó desde una ruta protegida (el
 *    `proxy.ts` propaga ese param), o a `/dashboard` por default.
 *    Preserva el locale via el `useRouter` i18n-aware.
 *  - Mapeo de errores de Better Auth a copy amigable i18n (no exponer
 *    mensajes técnicos en inglés del SDK al user final).
 *
 * El "Olvidaste tu contraseña?" linkea a `/contact` hasta que exista una
 * ruta `/forgot-password` dedicada. Decisión documentada acá y en BACKLOG:
 * `/contact` está mergeada y es la vía existente para que un user pida
 * reset manual mientras tanto. TODO(auth): swap a `/forgot-password`
 * cuando exista la ruta.
 */

import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { signIn } from "@/lib/auth-client"
import { signInSchema, type SignInInput } from "@/lib/validators/auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import AuthField from "@/components/auth/AuthField"

/** Códigos de error que el form sabe traducir. Combina:
 *  - Códigos del schema zod (`email_invalid`, etc.).
 *  - Códigos mapeados desde el `error.code` estable de Better Auth.
 * Lo demás cae al label `generic` del namespace i18n. */
const KNOWN_ERROR_CODES = new Set<string>([
  "email_required",
  "email_invalid",
  "email_too_long",
  "password_too_short",
  "password_too_long",
  "credentials",
])

/** Mapeo de `error.code` de Better Auth a códigos i18n del form. Los
 * códigos del SDK son estables entre versiones (los strings del `.message`
 * no — pueden cambiar copy en cualquier minor release). Acá listamos solo
 * los que tienen una traducción específica; el resto cae al fallback. */
const BETTER_AUTH_CODE_MAP: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "credentials",
  INVALID_EMAIL: "credentials",
  INVALID_PASSWORD: "credentials",
}

/** Resuelve el código i18n desde un error de Better Auth. Preferimos
 * `error.code` por su estabilidad; si no viene, caemos a heurística sobre
 * `error.message` (último recurso, frágil). */
function mapAuthErrorToCode(error?: {
  code?: string | null
  message?: string | null
}): string {
  if (!error) return "generic"
  if (error.code && BETTER_AUTH_CODE_MAP[error.code]) {
    return BETTER_AUTH_CODE_MAP[error.code]
  }
  const lower = (error.message ?? "").toLowerCase()
  if (
    lower.includes("invalid") &&
    (lower.includes("password") ||
      lower.includes("credential") ||
      lower.includes("email"))
  ) {
    return "credentials"
  }
  return "generic"
}

export interface SignInFormProps {
  /** Ruta interna (locale-less, ej. `/dashboard`) a la que volver tras el
   * login. La pasa la page ya validada con `sanitizeReturnTo`. Si no
   * viene, el login cae a `/dashboard`. */
  returnTo?: string
}

export default function SignInForm({ returnTo }: SignInFormProps) {
  const t = useTranslations("auth.signIn")
  const tErrors = useTranslations("auth.signIn.errors")
  const router = useRouter()

  const errorMessageFor = (code: string): string =>
    KNOWN_ERROR_CODES.has(code) ? tErrors(code) : tErrors("generic")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: SignInInput) {
    let res
    try {
      res = await signIn.email({
        email: values.email,
        password: values.password,
      })
    } catch {
      // Network failure / SDK lanza excepción no manejada — sin esto el
      // botón queda en isSubmitting indefinido y el user no sabe qué pasó.
      toast.error(errorMessageFor("generic"))
      return
    }

    if (res.error) {
      const code = mapAuthErrorToCode(res.error)
      toast.error(errorMessageFor(code))
      return
    }

    // `router` es locale-aware: `/dashboard` → `/es/dashboard`.
    router.push(returnTo ?? "/dashboard")
  }

  return (
    <form
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-l"
      noValidate
    >
      <AuthField
        id="signin-email"
        label={t("emailLabel")}
        error={errors.email ? errorMessageFor(errors.email.message ?? "") : undefined}
      >
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "signin-email-error" : undefined}
          {...register("email")}
        />
      </AuthField>

      <div className="flex flex-col gap-xs">
        <AuthField
          id="signin-password"
          label={t("passwordLabel")}
          error={errors.password ? errorMessageFor(errors.password.message ?? "") : undefined}
        >
          <Input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            placeholder={t("passwordPlaceholder")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "signin-password-error" : undefined}
            {...register("password")}
          />
        </AuthField>
        {/* TODO(auth): swap a `/forgot-password` cuando exista la ruta. */}
        <Link
          href="/contact"
          className="self-end text-body-s text-fg-secondary hover:text-fg-primary underline-offset-4 hover:underline"
        >
          {t("forgot")}
        </Link>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full bg-brand text-on-brand font-semibold hover:bg-brand-dim disabled:opacity-60"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  )
}
