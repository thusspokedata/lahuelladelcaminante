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
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard/artists"
            className="text-muted-foreground hover:text-primary inline-flex items-center text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </div>
        <h1 className="text-center text-2xl font-bold">Agregar Artista</h1>
        <div className="w-24"></div> {/* Spacer para balancear el header */}
      </div>

      <div className="mx-auto max-w-3xl">
        <CreateArtistForm userId={authResult.userId} />
      </div>
    </div>
  );
}
