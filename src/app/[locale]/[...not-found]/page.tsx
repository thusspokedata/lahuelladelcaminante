import { NotFoundUI } from "./ui/NotFoundUI";

export default async function NotFoundCatchAll({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <NotFoundUI locale={locale} />;
}
