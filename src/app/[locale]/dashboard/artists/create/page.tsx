import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ArtistForm from "./ArtistForm";
import { getArtistsByUser } from "@/services/artists";
import { getTranslations } from "next-intl/server";

type SearchParams = Promise<{ artistId?: string }>;

export default async function CreateArtistPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("artists");
  const commonT = await getTranslations("common");

  const authResult = await auth();

  if (!authResult.userId) {
    redirect("/sign-in");
  }

  // Get user's existing artists
  const userArtists = await getArtistsByUser(authResult.userId);

  // Get the artistId from the URL if it exists
  const { artistId } = await searchParams;

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard/artists"
            className="text-muted-foreground hover:text-primary inline-flex items-center text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {commonT("back")}
          </Link>
        </div>
        <h1 className="text-center text-2xl font-bold">{t("manageArtists")}</h1>
        <div className="w-24"></div> {/* Spacer para balancear el header */}
      </div>

      <div className="mx-auto max-w-3xl">
        <ArtistForm
          userId={authResult.userId}
          userArtists={userArtists}
          initialArtistId={artistId}
        />
      </div>
    </div>
  );
}
