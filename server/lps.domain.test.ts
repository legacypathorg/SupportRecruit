import { describe, expect, it } from "vitest";
import {
  APPLICATION_STATUSES,
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_LABELS,
  STATUS_EMAIL_MAP,
  STATUS_COLORS,
} from "../shared/lps";
import { generateReferenceNumber, generateResumeToken } from "./referenceNumber";
import { buildEmail, buildResumeEmail, wrapEmail } from "./emailTemplates";

describe("domain constants", () => {
  it("locks in exactly the 13 required application statuses", () => {
    expect(APPLICATION_STATUSES).toEqual([
      "New Application",
      "Under Review",
      "Additional Information Needed",
      "Interview Requested",
      "Interview Scheduled",
      "Approved",
      "Agreement Pending",
      "Registration Pending",
      "Training Pending",
      "Active Support Specialist",
      "Waitlisted",
      "Declined",
      "Withdrawn",
    ]);
  });

  it("locks in exactly the 9 lifecycle email templates", () => {
    expect(EMAIL_TEMPLATE_KEYS).toHaveLength(9);
    for (const key of EMAIL_TEMPLATE_KEYS) {
      expect(EMAIL_TEMPLATE_LABELS[key]).toBeTruthy();
    }
  });

  it("maps every auto-email status to a valid template", () => {
    for (const [status, template] of Object.entries(STATUS_EMAIL_MAP)) {
      expect(APPLICATION_STATUSES).toContain(status);
      expect(EMAIL_TEMPLATE_KEYS).toContain(template);
    }
  });

  it("defines a badge color for every status", () => {
    for (const status of APPLICATION_STATUSES) {
      expect(STATUS_COLORS[status]).toMatch(/bg-/);
    }
  });
});

describe("reference numbers & tokens", () => {
  it("generates reference numbers in the LPS-YYYY-XXXXXX format", () => {
    const ref = generateReferenceNumber();
    expect(ref).toMatch(/^LPS-\d{4}-[A-Z0-9]{6}$/);
  });

  it("generates unique values across many draws", () => {
    const seen = new Set(Array.from({ length: 500 }, () => generateReferenceNumber()));
    expect(seen.size).toBeGreaterThan(495);
  });

  it("generates long random resume tokens", () => {
    const token = generateResumeToken();
    expect(token.length).toBeGreaterThanOrEqual(24);
    expect(generateResumeToken()).not.toBe(token);
  });
});

describe("email templates", () => {
  const ctx = { applicantName: "Jane Doe", referenceNumber: "LPS-2026-TEST01" };

  it("renders all 9 lifecycle templates with name, reference, and branding", () => {
    for (const key of EMAIL_TEMPLATE_KEYS) {
      const { subject, html } = buildEmail(key, ctx);
      expect(subject.length).toBeGreaterThan(5);
      expect(html).toContain("Jane Doe");
      expect(html).toContain("LPS-2026-TEST01");
      expect(html).toContain("Legacy Path Solutions");
      // Navy-and-gold brand colors
      expect(html).toContain("#0F2044");
      expect(html).toContain("#C9A227");
    }
  });

  it("includes the $200 fee and no-payment warning in the approval email", () => {
    const { html } = buildEmail("application_approved", ctx);
    expect(html).toContain("$200");
  });

  it("supports an extra personal message", () => {
    const { html } = buildEmail("interview_invitation", { ...ctx, extraMessage: "See you Tuesday at 2pm." });
    expect(html).toContain("See you Tuesday at 2pm.");
  });

  it("builds a resume link email containing the link", () => {
    const { html } = buildResumeEmail("Jane", "https://example.com/apply?resume=abc123");
    expect(html).toContain("https://example.com/apply?resume=abc123");
  });

  it("wraps arbitrary content in the branded shell", () => {
    const html = wrapEmail("Test Title", "<p>Hello world</p>");
    expect(html).toContain("Test Title");
    expect(html).toContain("Hello world");
    expect(html).toContain("#0F2044");
  });
});
