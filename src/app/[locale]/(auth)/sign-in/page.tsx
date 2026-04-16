"use client"

import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { toast } from "sonner"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
type FormData = z.infer<typeof schema>

export default function SignInPage() {
  const t = useTranslations("auth")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const res = await signIn.email({
      email: data.email,
      password: data.password,
    })

    if (res.error) {
      toast.error(res.error.message ?? tCommon("error"))
      return
    }

    router.push(`/${locale}/dashboard`)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t("signIn")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? tCommon("loading") : t("signIn")}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn.social({ provider: "google", callbackURL: `/${locale}/dashboard` })}
          >
            {t("continueWithGoogle")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href={`/${locale}/sign-up`} className="underline">
              {t("signUp")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
