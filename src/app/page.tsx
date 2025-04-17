import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">La Huella del Caminante</h1>
        <p className="text-muted-foreground text-xl">Música Argentina en Berlín</p>
      </header>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>
              Descubre los próximos shows de música argentina en Berlín
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/events">
              <Button className="w-full">Ver Eventos</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Artistas</CardTitle>
            <CardDescription>Conoce a los artistas argentinos que actúan en Berlín</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Explorar Artistas</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
