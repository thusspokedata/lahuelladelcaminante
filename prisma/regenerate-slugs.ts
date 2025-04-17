import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

// Function to generate slugs from names
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

// Function to ensure unique artist slug
async function ensureUniqueArtistSlug(slug: string, existingId?: string): Promise<string> {
  let uniqueSlug = slug;
  let counter = 1;
  let exists = true;

  while (exists) {
    const where: any = { slug: uniqueSlug };

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
    const where: any = { slug: uniqueSlug };

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
  console.log(`Found ${artists.length} artists to update`);

  for (const artist of artists) {
    const baseSlug = generateSlug(artist.name);
    const uniqueSlug = await ensureUniqueArtistSlug(baseSlug, artist.id);

    await prisma.artist.update({
      where: { id: artist.id },
      data: { slug: uniqueSlug },
    });

    console.log(`Updated artist: ${artist.name} with slug: ${uniqueSlug}`);
  }
}

async function regenerateEventSlugs() {
  const events = await prisma.event.findMany();
  console.log(`Found ${events.length} events to update`);

  for (const event of events) {
    const baseSlug = generateSlug(event.title);
    const uniqueSlug = await ensureUniqueEventSlug(baseSlug, event.id);

    await prisma.event.update({
      where: { id: event.id },
      data: { slug: uniqueSlug },
    });

    console.log(`Updated event: ${event.title} with slug: ${uniqueSlug}`);
  }
}

async function main() {
  try {
    console.log("Starting slug regeneration...");

    // Regenerate slugs for artists
    await regenerateArtistSlugs();

    // Regenerate slugs for events
    await regenerateEventSlugs();

    console.log("Slug regeneration completed successfully");
  } catch (error) {
    console.error("Error during slug regeneration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
