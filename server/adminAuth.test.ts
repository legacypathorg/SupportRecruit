import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./adminAuth";

describe("admin password hashing", () => {
  it("hashes with a random salt and verifies correctly", () => {
    const hash = hashPassword("LegacyPath2026!");
    expect(hash).toContain(":");
    expect(verifyPassword("LegacyPath2026!", hash)).toBe(true);
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces different hashes for the same password (salted)", () => {
    const a = hashPassword("same");
    const b = hashPassword("same");
    expect(a).not.toBe(b);
    expect(verifyPassword("same", a)).toBe(true);
    expect(verifyPassword("same", b)).toBe(true);
  });
});
