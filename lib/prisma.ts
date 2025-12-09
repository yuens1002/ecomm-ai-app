import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import ws from "ws";

// Force node-api engine to avoid data-proxy/"client" engine requirements when no adapter is provided.
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";
process.env.PRISMA_GENERATE_ENGINE_TYPE = "library";

// Manually load .env.local if DATABASE_URL is missing (e.g. during build)
if (!process.env.DATABASE_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv").config({ path: ".env.local" });
    console.log("DEBUG: Loaded .env.local via dotenv");
  } catch {
    // ignore if dotenv is missing
  }
}

// Determine whether to use the Neon adapter (for serverless neon.tech) or fall back to a
// standard Postgres connection. Neon adapter stays opt-in so self-hosted Postgres works.
const shouldUseNeonAdapter = () => {
  const adapterEnv = process.env.DATABASE_ADAPTER?.toLowerCase();
  if (adapterEnv === "neon") return true;
  if (adapterEnv === "postgres" || adapterEnv === "standard") return false;
  return process.env.DATABASE_URL?.includes("neon.tech") ?? false;
};

// Configure Neon only when we actually need it.
const createAdapter = (connectionString: string) => {
  if (shouldUseNeonAdapter()) {
    neonConfig.webSocketConstructor = ws;
    return new PrismaNeon({ connectionString });
  }

  const pool = new Pool({ connectionString });
  return new PrismaPg(pool);
};

// This file creates a "singleton" of the Prisma Client to avoid exhausting connections.

// --- 1. Define a function that creates the client ---
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma");
  }

  const adapter = createAdapter(connectionString);
  return new PrismaClient({ adapter });
  // .$extends(withAccelerate()); // withAccelerate() is for Vercel's Data Cache
};

// --- 2. Define the global type using the function's return type ---
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// --- 3. Use the function to create/get the singleton ---
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// --- 4. The assignment now works because the types match ---
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
