import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join("src", "infrastructure", "database", "schema.prisma"),
  migrate: {
    async adapter(env) {
      const connectionString = env.DATABASE_URL;
      if (!connectionString) throw new Error("DATABASE_URL is not set");
      const { PrismaPg } = await import("@prisma/adapter-pg");
      return new PrismaPg({ connectionString });
    },
  },
});
