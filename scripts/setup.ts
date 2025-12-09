import "dotenv/config";
import { execSync } from "child_process";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (const arg of args) {
    const [rawKey, rawValue] = arg.split("=");
    if (!rawKey) continue;
    const key = rawKey.replace(/^--/, "");
    const value = rawValue ?? "true";
    parsed[key] = value;
  }

  const email = parsed.email?.trim();
  const password = parsed.password?.trim();
  const name = parsed.name?.trim();
  const productMode = parsed["product-mode"]?.toLowerCase() ?? "minimal";
  const seedUsers = parsed["seed-users"]?.toLowerCase() ?? "false";
  const seedSynthetic = parsed["seed-synthetic"]?.toLowerCase() ?? "false";

  if (!email || !password) {
    console.error(
      "Usage: npm run setup -- --email=owner@shop.com --password=secret [--name=Owner] [--product-mode=full|minimal] [--seed-users=true|false] [--seed-synthetic=true|false]"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  return { email, password, name, productMode, seedUsers, seedSynthetic };
}

function requireEnvVars(vars: string[]) {
  const missing = vars.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
}

function run(cmd: string, extraEnv?: Record<string, string>) {
  execSync(cmd, {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
}

async function upsertAdmin(email: string, password: string, name?: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  const adminName = name ?? "Shop Owner";

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, isAdmin: true, name: adminName },
    create: { email, passwordHash, isAdmin: true, name: adminName },
  });

  console.log(`✅ Admin ready: ${email}`);
}

async function main() {
  const { email, password, name, productMode, seedUsers, seedSynthetic } =
    parseArgs();

  requireEnvVars(["DATABASE_URL"]);

  console.log("🛠️  Running prisma generate...");
  run("npx prisma generate");

  console.log("🚚 Running prisma migrate deploy...");
  run("npx prisma migrate deploy");

  console.log(
    `🌱 Running seeds (SEED_PRODUCT_MODE=${productMode}, SEED_INCLUDE_USERS=${seedUsers}, SEED_INCLUDE_SYNTHETIC=${seedSynthetic})...`
  );
  run("npm run seed", {
    SEED_PRODUCT_MODE: productMode,
    SEED_INCLUDE_USERS: seedUsers,
    SEED_INCLUDE_SYNTHETIC: seedSynthetic,
  });

  console.log("🔐 Creating admin user...");
  await upsertAdmin(email, password, name);

  console.log("✅ Setup complete. You can now sign in with the admin account.");
}

main()
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
