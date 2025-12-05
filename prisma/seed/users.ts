import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedUsers(prisma: PrismaClient) {
  console.log("  👥 Creating demo users...");

  const demoUsers = [
    {
      email: "demo@artisanroast.com",
      name: "Demo User",
      isAdmin: false,
      password: "ixcF8ZV3FnGaBJ&#8j",
    },
    {
      email: "admin@artisanroast.com",
      name: "Admin User",
      isAdmin: true,
      password: "ivcF8ZV3FnGaBJ&#8j",
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
    const passwordHash = userData.password
      ? await bcrypt.hash(userData.password, 10)
      : undefined;

    await prisma.user.upsert({
      where: { email: userData.email },
      update: passwordHash ? { passwordHash } : {},
      create: {
        email: userData.email,
        name: userData.name,
        isAdmin: userData.isAdmin,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });
    console.log(`    ✓ ${userData.name} (${userData.email})`);
  }

  console.log("  ✅ Demo users created");
}
