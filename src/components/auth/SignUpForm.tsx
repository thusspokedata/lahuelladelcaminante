"use client"

/**
 * SignUpForm — form client de `/sign-up`. Mismo patrón que SignInForm,
 * extendido con:
 *  - Campo `name` (2-120 chars).
 *  - Campo `password` con hint estático de fortaleza (recomendación, no
 *    obligación — Better Auth solo enforce `minPasswordLength: 8`).
 *  - Checkbox `acceptTerms` (required) con rich-text wrappers que linkean
 *    a `/terms` y `/privacy`. Esas rutas no existen aún — apuntan a `#`
 *    con TODO en el código. Decisión del spec: no bloquear esta PR.
 *
 * Único método de auth: email/password (Better Auth). El login con
 * Google OAuth se removió — ver `chore/remove-google-oauth`.
 *
 * En éxito redirige a la home (`/`, respetando el locale activo), o a la
 * ruta `returnTo` si la persona llegó al sign-up desde una ruta protegida
 * (el `proxy.ts` propaga ese param a sign-in/sign-up). Decisión de
 * producto: la mayoría de los signups NO buscan el panel creator, así
 * que el default es la home y no `/dashboard`. El `returnTo` ya llega
 * validado como ruta interna desde la page (anti open-redirect).
 */

import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter, Link } from "@/i18n/navigation"
import { signUp } from "@/lib/auth-client"
import { signUpSchema, type SignUpInput } from "@/lib/validators/auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import AuthField from "@/components/auth/AuthField"
import { cn } from "@/lib/utils"

const KNOWN_ERROR_CODES = new Set<string>([
  "name_too_short",
  "name_too_long",
  "email_required",
  "email_invalid",
  "email_too_long",
  "password_too_short",
  "password_too_long",
  "terms_required",
  "email_taken",
])

/** Codes estables de Better Auth → códigos i18n del form. Mismo
 * principio que en SignInForm: preferimos `error.code` por estabilidad
 * y caemos a heurística sobre `.message` solo como último recurso. */
const BETTER_AUTH_CODE_MAP: Record<string, string> = {
  USER_ALREADY_EXISTS: "email_taken",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "email_taken",
  EMAIL_ALREADY_EXISTS: "email_taken",
}

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
    lower.includes("already") ||
    lower.includes("exist") ||
    lower.includes("registered")
  ) {
    return "email_taken"
  }
  return "generic"
}

export interface SignUpFormProps {
  /** Ruta interna (locale-less, ej. `/dashboard`) a la que volver tras el
   * signup. La pasa la page ya validada con `sanitizeReturnTo`. Si no
   * viene, el signup directo cae a la home. */
  returnTo?: string
}

export default function SignUpForm({ returnTo }: SignUpFormProps) {
  const t = useTranslations("auth.signUp")
  const tErrors = useTranslations("auth.signUp.errors")
  const router = useRouter()

  const errorMessageFor = (code: string): string =>
    KNOWN_ERROR_CODES.has(code) ? tErrors(code) : tErrors("generic")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", acceptTerms: false },
  })

  async function onSubmit(values: SignUpInput) {
    let res
    try {
      res = await signUp.email({
        name: values.name,
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

    // `router` es locale-aware: `/` → `/es`, `/dashboard` → `/es/dashboard`.
    router.push(returnTo ?? "/")
  }

  return (
    <form
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-l"
      noValidate
    >
      <AuthField
        id="signup-name"
        label={t("nameLabel")}
        error={errors.name ? errorMessageFor(errors.name.message ?? "") : undefined}
      >
        <Input
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "signup-name-error" : undefined}
          {...register("name")}
        />
      </AuthField>

      <AuthField
        id="signup-email"
        label={t("emailLabel")}
        error={errors.email ? errorMessageFor(errors.email.message ?? "") : undefined}
      >
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          {...register("email")}
        />
      </AuthField>

      <AuthField
        id="signup-password"
        label={t("passwordLabel")}
        hint={t("passwordHint")}
        error={errors.password ? errorMessageFor(errors.password.message ?? "") : undefined}
      >
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          placeholder={t("passwordPlaceholder")}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "signup-password-error" : "signup-password-hint"
          }
          {...register("password")}
        />
      </AuthField>

      {/* Checkbox de aceptación de términos. No usamos un componente
          `Checkbox` reusable porque (a) no existe en el proyecto y (b)
          esta es la única instancia del PR — bikeshed prematuro. El
          rich-text de la label resuelve los dos links via wrappers
          `<terms>` y `<privacy>`. TODO(legal): apuntan a `#` hasta que
          existan las páginas legales (anotado en BACKLOG bajo GDPR). */}
      <div className="flex flex-col gap-xs">
        <label
          htmlFor="signup-accept-terms"
          className={cn(
            "flex items-start gap-s text-body-s text-fg-secondary leading-relaxed cursor-pointer",
            errors.acceptTerms && "text-status-danger"
          )}
        >
          <input
            id="signup-accept-terms"
            type="checkbox"
            className="mt-[3px] h-4 w-4 rounded-sm border border-border-hi accent-brand"
            aria-invalid={Boolean(errors.acceptTerms)}
            aria-describedby={
              errors.acceptTerms ? "signup-accept-terms-error" : undefined
            }
            {...register("acceptTerms")}
          />
          <span>
            {t.rich("acceptTerms", {
              terms: (chunks) => (
                <Link
                  href="#"
                  className="font-semibold text-fg-primary underline-offset-4 hover:underline"
                >
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link
                  href="#"
                  className="font-semibold text-fg-primary underline-offset-4 hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        {errors.acceptTerms ? (
          <p
            id="signup-accept-terms-error"
            className="text-body-s text-status-danger"
            role="alert"
          >
            {errorMessageFor(errors.acceptTerms.message ?? "")}
          </p>
        ) : null}
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
