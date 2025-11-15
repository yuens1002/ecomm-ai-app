import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Fetching all users from database...\n");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      createdAt: true,
      emailVerified: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (users.length === 0) {
    console.log("No users found in database.");
    return;
  }

  console.log(`Found ${users.length} user(s):\n`);

  users.forEach((user, index) => {
    console.log(`User ${index + 1}:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name || "(not set)"}`);
    console.log(
      `  Has Password: ${
        user.passwordHash ? "Yes (encrypted)" : "No (OAuth only)"
      }`
    );
    console.log(`  Email Verified: ${user.emailVerified || "Not verified"}`);
    console.log(`  Created: ${user.createdAt.toLocaleString()}`);
    console.log("");
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
