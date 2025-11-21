import { config } from "dotenv";
config({ path: ".env.local" }); // This line is correct and loads .env.local

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
  // @ts-expect-error - seed is supported in runtime but types might be missing
  seed: {
    command: "tsx prisma/seed.ts",
  },
});
