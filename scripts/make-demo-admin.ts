import "dotenv/config";
import { prisma } from "../lib/prisma";

async function makeDemoAdminUser() {
  const user = await prisma.user.update({
    where: { email: "demo@artisanroast.com" },
    data: { isAdmin: true },
  });

  console.log("✅ Demo user is now admin:", user.email);
}

makeDemoAdminUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
