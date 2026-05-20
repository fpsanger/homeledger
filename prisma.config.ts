import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/infrastructure/database/schema.prisma",
  migrations: {
    path: "src/infrastructure/database/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
