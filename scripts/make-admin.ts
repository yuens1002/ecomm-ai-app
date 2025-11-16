/**
 * One-time script to set a user as admin
 * Run with: npx ts-node scripts/make-admin.ts
 */

import { prisma } from "../lib/prisma";

const ADMIN_EMAIL = "yuens1002@gmail.com"; // Change this to your email

async function main() {
  const user = await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { isAdmin: true },
  });

  console.log(`✅ Set ${user.email} as admin`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
