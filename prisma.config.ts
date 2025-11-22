import { config } from "dotenv";
config({ path: ".env.local" }); // This line is correct and loads .env.local

// @ts-ignore
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
  seed: {
    command: "tsx prisma/seed.ts",
  },
});
