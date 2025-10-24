import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load environment variables from the package .env so `prisma generate` sees DATABASE_URL
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
