import { PrismaClient } from "../src/generated/prisma";
import { mockArtists, mockEvents } from "../src/mockData";

const prisma = new PrismaClient();

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
    const artist = await prisma.artist.create({
      data: {
        id: artistData.id, // Use the same ID for reference
        name: artistData.name,
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

    console.log(`Created artist: ${artist.name}`);
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

    // Create the event
    const event = await prisma.event.create({
      data: {
        id: eventData.id, // Use the same ID for reference
        title: eventData.title,
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

    console.log(`Created event: ${event.title}`);
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
