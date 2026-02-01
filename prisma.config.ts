import { config } from "dotenv";
config({ path: ".env.local" }); // This line is correct and loads .env.local

import { defineConfig } from "prisma/config";

// Fallback for prisma generate during npm install (doesn't need real DB)
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/index.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
