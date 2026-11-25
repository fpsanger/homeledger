const FIELDS = ["referenceMinPer1kBrl", "referenceMaxPer1kBrl"] as const;

type ReferenceField = (typeof FIELDS)[number];

/**
 * Checks the shape of the optional reference-range fields in a request body.
 * Absent keys are fine (PUT keeps the stored value) and null clears the bound.
 * Domain rules (positive, min <= max) are enforced by the entity / use case.
 */
export function validateReferenceBody(body: Record<string, unknown>): string | null {
  for (const field of FIELDS) {
    const value = body[field];
    if (value === undefined || value === null) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return `${field} must be a number or null`;
    }
  }
  return null;
}

export function pickReferenceFields(
  body: Record<string, unknown>,
): Partial<Record<ReferenceField, number | null>> {
  const picked: Partial<Record<ReferenceField, number | null>> = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) picked[field] = body[field] as number | null;
  }
  return picked;
}
