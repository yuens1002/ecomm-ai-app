import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (const arg of args) {
    const [key, value] = arg.split("=");
    if (key && value) {
      parsed[key.replace(/^--/, "")] = value;
    }
  }

  const email = parsed.email?.trim();
  const password = parsed.password?.trim();
  const name = parsed.name?.trim();

  if (!email || !password) {
    console.error(
      "Usage: npm run create-admin -- --email=owner@shop.com --password=secret [--name=Owner]"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  return { email, password, name };
}

async function main() {
  const { email, password, name } = parseArgs();

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        isAdmin: true,
        passwordHash,
        name: name ?? existing.name ?? "Owner",
      },
    });
    console.log(`✅ Updated admin account: ${updated.email}`);
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        name: name ?? "Shop Owner",
        isAdmin: true,
        passwordHash,
      },
    });
    console.log(`✅ Created admin account: ${created.email}`);
  }

  console.log("ℹ️  Safe to rerun; existing user will be updated.");
}

main()
  .catch((error) => {
    console.error("❌ Failed to create admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
