import { AuthProvider } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo users
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice Johnson",
      passwordHash,
      provider: AuthProvider.email,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob Smith",
      passwordHash,
      provider: AuthProvider.email,
    },
  });

  console.log(`✅ Created users: ${alice.name}, ${bob.name}`);

  // Create demo poll
  const poll = await prisma.poll.create({
    data: {
      question: "What is the best programming language in 2026?",
      creatorId: alice.id,
      isPublic: true,
      options: {
        create: [
          { text: "TypeScript" },
          { text: "Rust" },
          { text: "Python" },
          { text: "Go" },
        ],
      },
    },
    include: { options: true },
  });

  console.log(`✅ Created poll: "${poll.question}" with ${poll.options.length} options`);

  // Create a second poll
  const poll2 = await prisma.poll.create({
    data: {
      question: "Favorite frontend framework?",
      creatorId: bob.id,
      isPublic: true,
      options: {
        create: [
          { text: "Next.js" },
          { text: "Svelte" },
          { text: "Vue" },
          { text: "Astro" },
          { text: "Remix" },
        ],
      },
    },
    include: { options: true },
  });

  console.log(`✅ Created poll: "${poll2.question}" with ${poll2.options.length} options`);
  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
