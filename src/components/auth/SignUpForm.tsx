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
 *  - OAuth Google (decisión consistente con sign-in: mantener el flow
 *    OAuth disponible en ambos lados).
 *
 * En éxito: redirige a `/dashboard`. Ahí `requireActive()` decide qué
 * mostrar según el `UserProfile.status` (PENDING → `/user-pending`,
 * BLOCKED → `/user-blocked`, ACTIVE → render del dashboard). No
 * deciden acá — toda la lógica de routing post-auth es responsabilidad
 * del guard de auth.
 */

import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter, Link } from "@/i18n/navigation"
import { signUp, signIn } from "@/lib/auth-client"
import { signUpSchema, type SignUpInput } from "@/lib/validators/auth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import AuthField from "@/components/auth/AuthField"
import OAuthButton from "@/components/auth/OAuthButton"
import OrDivider from "@/components/auth/OrDivider"
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
])

/** Mismo principio que SignInForm: aislar el form del mensaje exacto
 * del SDK. El error más típico del sign-up es "user already exists"
 * (email duplicado); el resto cae a `generic`. */
function mapAuthErrorToCode(message?: string | null): string {
  if (!message) return "generic"
  const lower = message.toLowerCase()
  if (lower.includes("already") || lower.includes("exist") || lower.includes("registered")) {
    return "email_taken"
  }
  return "generic"
}

export interface SignUpFormProps {
  locale: string
}

export default function SignUpForm({ locale }: SignUpFormProps) {
  const t = useTranslations("auth.signUp")
  const tErrors = useTranslations("auth.signUp.errors")
  const router = useRouter()

  const errorMessageFor = (code: string): string =>
    KNOWN_ERROR_CODES.has(code) || code === "email_taken"
      ? tErrors(code)
      : tErrors("generic")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", acceptTerms: false as true },
  })

  async function onSubmit(values: SignUpInput) {
    const res = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    })

    if (res.error) {
      const code = mapAuthErrorToCode(res.error.message)
      toast.error(errorMessageFor(code))
      return
    }

    router.push("/dashboard")
  }

  function handleGoogleClick() {
    signIn.social({
      provider: "google",
      callbackURL: `/${locale}/dashboard`,
    })
  }

  return (
    <form
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-l"
      noValidate
    >
      <OAuthButton
        provider="google"
        label={t("continueWith", { provider: "Google" })}
        onClick={handleGoogleClick}
        disabled={isSubmitting}
      />

      <OrDivider label={t("orEmail")} />

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
