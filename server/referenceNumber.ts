import { randomInt } from "crypto";

/** Generates a unique application reference number like LPS-2026-48D2K7 */
export function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += alphabet[randomInt(alphabet.length)];
  return `LPS-${year}-${suffix}`;
}

export function generateResumeToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("hex");
}
