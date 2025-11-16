import "dotenv/config";
import { prisma } from "../lib/prisma";

async function setAdmin() {
  const email = "yuens1002@gmail.com";

  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true },
  });

  console.log(`✅ Set ${user.email} as admin`);
}

setAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
