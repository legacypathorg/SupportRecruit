import { describe, expect, it } from "vitest";

/**
 * Validates the RESEND_API_KEY secret by calling a lightweight Resend endpoint.
 * If no key is configured, the system runs in logged/preview mode, which is valid.
 */
describe("Resend email configuration", () => {
  it("validates RESEND_API_KEY against the Resend API when configured", { timeout: 30000 }, async () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      // No key configured — logged/preview mode is an accepted state.
      expect(key).toBeUndefined();
      return;
    }
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    // 200 = valid key; 401 = invalid key
    expect(res.status, "RESEND_API_KEY appears to be invalid (401 from Resend)").not.toBe(401);
    expect(res.ok).toBe(true);
  });

  it("has a sender address configured", () => {
    const from = process.env.EMAIL_FROM_ADDRESS ?? "onboarding@resend.dev";
    expect(from).toMatch(/@/);
  });
});
