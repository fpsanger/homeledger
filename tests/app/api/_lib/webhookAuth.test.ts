import { isAuthorizedWebhook } from "../../../../src/app/api/_lib/webhookAuth";

describe("isAuthorizedWebhook", () => {
  it("accepts the configured token sent as a Bearer credential", () => {
    expect(isAuthorizedWebhook("Bearer s3cret-token", "s3cret-token")).toBe(true);
  });

  it("accepts a lowercase scheme", () => {
    expect(isAuthorizedWebhook("bearer s3cret-token", "s3cret-token")).toBe(true);
  });

  it.each([
    ["a missing header", null],
    ["an empty header", ""],
    ["a different token", "Bearer other-token"],
    ["a token with the same prefix", "Bearer s3cret-token-and-more"],
    ["a shorter token", "Bearer s3cret"],
    ["no scheme", "s3cret-token"],
    ["another scheme", "Basic s3cret-token"],
    ["an empty bearer", "Bearer "],
  ])("rejects %s", (_label, header) => {
    expect(isAuthorizedWebhook(header, "s3cret-token")).toBe(false);
  });

  it("rejects everything when no token is configured", () => {
    expect(isAuthorizedWebhook("Bearer ", "")).toBe(false);
    expect(isAuthorizedWebhook("Bearer anything", "")).toBe(false);
  });
});
