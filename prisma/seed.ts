import { PrismaClient } from "../src/generated/prisma";
import { mockArtists, mockEvents } from "../src/mockData";

const prisma = new PrismaClient();

// Map to store the new IDs generated by Prisma for artists
const artistIdMap = new Map<string, string>();

// Function to generate slugs from names
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  await prisma.image.deleteMany();
  await prisma.eventDate.deleteMany();
  await prisma.event.deleteMany();
  await prisma.artist.deleteMany();

  console.log("Deleted existing data");

  // Seed artists
  for (const artistData of mockArtists) {
    const artistSlug = generateSlug(artistData.name);

    const artist = await prisma.artist.create({
      data: {
        // Remove the id field to let Prisma generate a CUID
        name: artistData.name,
        slug: artistSlug,
        genres: artistData.genres,
        bio: artistData.bio,
        origin: artistData.origin,
        socialMedia: artistData.socialMedia || {},
        // Create images
        images: {
          create: artistData.images.map((img) => ({
            url: img.url,
            alt: img.alt,
          })),
        },
      },
    });

    // Store the mapping between original ID and Prisma-generated ID
    artistIdMap.set(artistData.id, artist.id);
    console.log(`Created artist: ${artist.name} with ID: ${artist.id} and slug: ${artist.slug}`);
  }

  // Seed events
  for (const eventData of mockEvents) {
    // Find artist by name to get artist ID
    const artist = await prisma.artist.findFirst({
      where: { name: eventData.artist },
    });

    if (!artist) {
      console.log(`Artist not found for event: ${eventData.title}`);
      continue;
    }

    const eventSlug = generateSlug(eventData.title);

    // Create the event
    const event = await prisma.event.create({
      data: {
        // Remove the id field to let Prisma generate a CUID
        title: eventData.title,
        slug: eventSlug,
        description: eventData.description || "",
        time: eventData.time,
        location: eventData.location,
        price: eventData.price !== undefined ? eventData.price : null,
        genre: eventData.genre,
        artistId: artist.id,
        // Create date entries
        dates: {
          create: eventData.dates.map((date) => ({
            date: date.dateObj,
          })),
        },
        // Create images
        images: {
          create: eventData.images.map((img) => ({
            url: img.url,
            alt: img.alt,
          })),
        },
      },
    });

    console.log(`Created event: ${event.title} with ID: ${event.id} and slug: ${event.slug}`);
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
