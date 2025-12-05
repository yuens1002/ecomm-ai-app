import { PrismaClient } from "@prisma/client";

export async function seedUsers(prisma: PrismaClient) {
  console.log("  👥 Creating demo users...");

  const demoUsers = [
    {
      email: "demo@artisanroast.com",
      name: "Demo User",
      isAdmin: false,
    },
    {
      email: "admin@artisanroast.com",
      name: "Admin User",
      isAdmin: true,
    },
    {
      email: "sarah.coffee@example.com",
      name: "Sarah Johnson",
      isAdmin: false,
    },
    {
      email: "mike.espresso@example.com",
      name: "Mike Chen",
      isAdmin: false,
    },
    {
      email: "emily.brew@example.com",
      name: "Emily Rodriguez",
      isAdmin: false,
    },
  ];

  for (const userData of demoUsers) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`    ✓ ${userData.name} (${userData.email})`);
  }

  console.log("  ✅ Demo users created");
}
