import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

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

// Configure neon to use ws for WebSocket connections (required for non-edge environments like Node.js build)
neonConfig.webSocketConstructor = ws;

// This file creates a "singleton" of the Prisma Client.
// This is a best practice to prevent exhausting the database
// connection limit in a serverless environment.

// --- 1. Define a function that creates the client ---
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL!;

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
  });
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
