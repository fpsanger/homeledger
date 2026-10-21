import { prisma } from "../../../infrastructure/database/client";

// This handler reads no request data, so Next would otherwise evaluate it at build time.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Database check failed";
    return Response.json({ status: "error", error: reason }, { status: 503 });
  }
}
