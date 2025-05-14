import { PrismaClient } from "../src/generated/prisma";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

// Function to ensure unique artist slug
async function ensureUniqueArtistSlug(slug: string, existingId?: string): Promise<string> {
  let uniqueSlug = slug;
  let counter = 1;
  let exists = true;

  while (exists) {
    const where: { slug: string; id?: { not: string } } = { slug: uniqueSlug };

    // Exclude the current entity when updating
    if (existingId) {
      where.id = { not: existingId };
    }

    const count = await prisma.artist.count({ where });

    if (count === 0) {
      exists = false;
    } else {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  return uniqueSlug;
}

// Function to ensure unique event slug
async function ensureUniqueEventSlug(slug: string, existingId?: string): Promise<string> {
  let uniqueSlug = slug;
  let counter = 1;
  let exists = true;

  while (exists) {
    const where: { slug: string; id?: { not: string } } = { slug: uniqueSlug };

    // Exclude the current entity when updating
    if (existingId) {
      where.id = { not: existingId };
    }

    const count = await prisma.event.count({ where });

    if (count === 0) {
      exists = false;
    } else {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  return uniqueSlug;
}

async function regenerateArtistSlugs() {
  const artists = await prisma.artist.findMany();

  for (const artist of artists) {
    const baseSlug = slugify(artist.name);
    const uniqueSlug = await ensureUniqueArtistSlug(baseSlug, artist.id);

    await prisma.artist.update({
      where: { id: artist.id },
      data: { slug: uniqueSlug },
    });
  }
}

async function regenerateEventSlugs() {
  const events = await prisma.event.findMany();

  for (const event of events) {
    const baseSlug = slugify(event.title);
    const uniqueSlug = await ensureUniqueEventSlug(baseSlug, event.id);

    await prisma.event.update({
      where: { id: event.id },
      data: { slug: uniqueSlug },
    });
  }
}

async function main() {
  try {
    // Regenerate slugs for artists
    await regenerateArtistSlugs();

    // Regenerate slugs for events
    await regenerateEventSlugs();
  } catch (error) {
    console.error("Error during slug regeneration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
