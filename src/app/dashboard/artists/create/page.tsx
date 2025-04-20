import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CreateArtistForm from "./CreateArtistForm";

export default async function CreateArtistPage() {
  const authResult = await auth();

  if (!authResult.userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agregar Artista</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/artists">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <div className="mx-auto max-w-3xl">
        <CreateArtistForm userId={authResult.userId} />
      </div>
    </div>
  );
}
