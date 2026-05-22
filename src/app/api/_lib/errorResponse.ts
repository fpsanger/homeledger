import { DuplicateCategoryError, NotFoundError } from "../../../domain/errors";

export function errorResponse(error: unknown): Response {
  if (error instanceof NotFoundError) {
    return Response.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof DuplicateCategoryError) {
    return Response.json({ error: error.message }, { status: 409 });
  }
  // Prisma P2025: record not found during update/delete
  if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2025") {
    return Response.json({ error: "Record not found" }, { status: 404 });
  }
  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
