export function errorResponse(error: unknown): Response {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("not found")) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
