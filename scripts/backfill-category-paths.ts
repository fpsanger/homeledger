/**
 * Backfill path and level for categories that have path = "".
 *
 * Usage:
 *   DATABASE_URL=<url> npx tsx scripts/backfill-category-paths.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

async function computePath(
  prisma: PrismaClient,
  id: string,
  cache: Map<string, { path: string; level: number }>,
): Promise<{ path: string; level: number }> {
  if (cache.has(id)) return cache.get(id)!;

  const row = await prisma.category.findUniqueOrThrow({ where: { id } });

  if (!row.parentId) {
    const result = { path: row.name, level: 0 };
    cache.set(id, result);
    return result;
  }

  const parent = await computePath(prisma, row.parentId, cache);
  const result = { path: `${parent.path}/${row.name}`, level: parent.level + 1 };
  cache.set(id, result);
  return result;
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as never);

  const categories = await prisma.category.findMany();
  const toFix = categories.filter((c) => !c.path);

  if (toFix.length === 0) {
    console.log("No categories need backfilling.");
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  console.log(`Backfilling ${toFix.length} categories...`);

  const cache = new Map<string, { path: string; level: number }>();

  for (const cat of toFix) {
    const { path, level } = await computePath(prisma, cat.id, cache);
    await prisma.category.update({ where: { id: cat.id }, data: { path, level } });
    console.log(`  ${cat.name} → path="${path}", level=${level}`);
  }

  console.log("Done.");
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
