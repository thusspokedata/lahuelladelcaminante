import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Información Legal | La Huella del Caminante",
  description: "Información legal y política de privacidad de La Huella del Caminante",
};

export default function LegalIndexPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Información Legal</h1>

      <p className="text-muted-foreground mb-6">
        Aquí puedes encontrar toda la información legal relevante sobre La Huella del Caminante, de
        acuerdo con la legislación alemana y europea.
      </p>

      <div className="space-y-4">
        <Link
          href="/legal/impressum"
          className="border-border hover:border-primary hover:bg-secondary/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
        >
          <div>
            <h2 className="text-xl font-medium">Impressum</h2>
            <p className="text-muted-foreground">
              Información legal del operador del sitio web (requerido por ley alemana)
            </p>
          </div>
          <ChevronRight className="text-primary h-5 w-5" />
        </Link>

        <Link
          href="/legal/privacy-policy"
          className="border-border hover:border-primary hover:bg-secondary/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
        >
          <div>
            <h2 className="text-xl font-medium">Política de Privacidad</h2>
            <p className="text-muted-foreground">
              Cómo recopilamos, procesamos y protegemos tus datos
            </p>
          </div>
          <ChevronRight className="text-primary h-5 w-5" />
        </Link>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-primary hover:underline">
          ← Volver a la página principal
        </Link>
      </div>
    </div>
  );
}
