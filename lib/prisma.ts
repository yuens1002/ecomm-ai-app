import { Pool } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";
// import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaNeon } from "@prisma/adapter-neon";

// This file creates a "singleton" of the Prisma Client.
// This is a best practice to prevent exhausting the database
// connection limit in a serverless environment.

// --- 1. Define a function that creates the client ---
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL!;

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);

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
