import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function UserBlockedPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "auth" })

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t("blockedTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{t("blockedDescription")}</p>
          <Button variant="outline" asChild>
            <Link href={`/${locale}`}>Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
