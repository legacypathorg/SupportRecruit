import { getDb } from "./db";
import { emailLog } from "../drizzle/schema";

/**
 * Email delivery service.
 * - Always logs every email to the email_log table (auditable history + admin preview).
 * - If RESEND_API_KEY is configured, also delivers via Resend's transactional API.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  templateKey: string;
  applicationId?: number;
  sentBy?: string;
}): Promise<{ delivered: boolean; logged: boolean }> {
  let delivered = false;
  const apiKey = process.env.RESEND_API_KEY;
  const rawFrom = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_FROM || "onboarding@resend.dev";
  const fromAddress = rawFrom.includes("<") ? rawFrom : `Legacy Path Solutions <${rawFrom}>`;

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [opts.to],
          subject: opts.subject,
          html: opts.html,
        }),
      });
      delivered = res.ok;
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn("[Email] Resend delivery failed:", res.status, errText);
        // Surface a human-readable hint for the most common misconfiguration
        if (res.status === 403 && errText.includes("not verified")) {
          console.warn(
            "[Email] HINT: The sending domain is not verified in Resend. Add the DNS records shown at https://resend.com/domains, wait for verification, then emails will deliver."
          );
        }
      }
    } catch (err) {
      console.warn("[Email] Resend delivery error:", err);
    }
  }

  let logged = false;
  try {
    const db = await getDb();
    if (db) {
      await db.insert(emailLog).values({
        applicationId: opts.applicationId ?? null,
        templateKey: opts.templateKey,
        recipient: opts.to,
        subject: opts.subject,
        htmlBody: opts.html,
        deliveryStatus: delivered ? "sent" : apiKey ? "failed" : "logged",
        sentBy: opts.sentBy ?? "system",
      });
      logged = true;
    }
  } catch (err) {
    console.error("[Email] Failed to log email:", err);
  }

  return { delivered, logged };
}
