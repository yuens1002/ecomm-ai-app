import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local explicitly
config({ path: resolve(process.cwd(), ".env.local") });

import { prisma } from "../lib/prisma";

async function removeAllAdmins() {
  try {
    console.log("🔍 Finding all admin users...");

    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true, email: true, name: true },
    });

    if (admins.length === 0) {
      console.log("✅ No admin users found");
      return;
    }

    console.log(`Found ${admins.length} admin(s):`);
    admins.forEach((admin) => {
      console.log(`  - ${admin.name || "No name"} (${admin.email})`);
    });

    console.log("\n🔄 Removing admin privileges from all users...");

    const result = await prisma.user.updateMany({
      where: { isAdmin: true },
      data: { isAdmin: false },
    });

    console.log(`✅ Removed admin privileges from ${result.count} user(s)`);
    console.log("\n💡 You can now test the initial setup flow at /setup");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeAllAdmins();
