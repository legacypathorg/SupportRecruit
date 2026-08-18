import { BRAND, type EmailTemplateKey } from "../shared/lps";

export interface EmailContext {
  applicantName: string;
  referenceNumber: string;
  extraMessage?: string;
  interviewDate?: string;
  resumeLink?: string;
  appUrl?: string;
}

/** Branded navy-and-gold HTML email wrapper */
export function wrapEmail(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${BRAND.cream};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(15,32,68,0.12);">
        <tr>
          <td style="background-color:${BRAND.navy};padding:28px 40px;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:1px;">Legacy Path <span style="color:${BRAND.gold};">Solutions</span></div>
            <div style="height:3px;width:64px;background-color:${BRAND.gold};margin:14px auto 0;"></div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="margin:0 0 20px;font-size:22px;color:${BRAND.navy};">${title}</h1>
            <div style="font-size:15px;line-height:1.7;color:#333f55;">${bodyHtml}</div>
          </td>
        </tr>
        <tr>
          <td style="background-color:${BRAND.navy};padding:22px 40px;text-align:center;">
            <div style="color:${BRAND.gold};font-size:13px;font-weight:bold;letter-spacing:0.5px;">LEGACY PATH SOLUTIONS</div>
            <div style="color:#aab6cc;font-size:12px;margin-top:6px;">Support Specialist Program &middot; Organization, Protection &amp; Intentional Legacy Planning</div>
            <div style="color:#7d8aa5;font-size:11px;margin-top:10px;">This message was sent regarding your Support Specialist application. Please do not reply directly to this email.</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const refBadge = (ref: string) =>
  `<div style="margin:20px 0;padding:14px 18px;background-color:#FAF7F0;border-left:4px solid ${BRAND.gold};border-radius:4px;">
    <span style="font-size:13px;color:#6b7280;">Application Reference Number</span><br>
    <strong style="font-size:17px;color:${BRAND.navy};letter-spacing:1px;">${ref}</strong>
  </div>`;

const goldButton = (label: string, href: string) =>
  `<div style="text-align:center;margin:26px 0;">
    <a href="${href}" style="display:inline-block;background-color:${BRAND.gold};color:${BRAND.navy};font-weight:bold;font-size:15px;padding:13px 32px;border-radius:6px;text-decoration:none;">${label}</a>
  </div>`;

const signOff = `<p style="margin-top:26px;">Warm regards,<br><strong style="color:#0F2044;">The Legacy Path Solutions Team</strong></p>`;

export function buildEmail(key: EmailTemplateKey, ctx: EmailContext): { subject: string; html: string } {
  const { applicantName, referenceNumber } = ctx;
  const extra = ctx.extraMessage
    ? `<div style="margin:18px 0;padding:14px 18px;background:#f4f6fb;border-radius:6px;color:#333f55;">${ctx.extraMessage}</div>`
    : "";

  switch (key) {
    case "application_received":
      return {
        subject: `We've Received Your Application — ${referenceNumber} | Legacy Path Solutions`,
        html: wrapEmail("Your Application Has Been Received", `
          <p>Dear ${applicantName},</p>
          <p>Thank you for applying to become a <strong>Legacy Path Solutions Support Specialist</strong>. Your application has been received and is now in our review queue.</p>
          ${refBadge(referenceNumber)}
          <p>Our team reviews each application carefully, considering experience, alignment, and potential service area. You can expect to hear from us regarding next steps.</p>
          <p><em>Please note: submitting an application does not guarantee acceptance into the Support Specialist Program. Do not submit any payment until you have received an official approval notice.</em></p>
          ${extra}${signOff}`),
      };
    case "additional_info_requested":
      return {
        subject: `Additional Information Needed — ${referenceNumber} | Legacy Path Solutions`,
        html: wrapEmail("We Need a Little More Information", `
          <p>Dear ${applicantName},</p>
          <p>Thank you for your application to the Support Specialist Program. To continue our review, we need some additional information from you.</p>
          ${refBadge(referenceNumber)}
          ${extra}
          <p>Please reply to our team at your earliest convenience so we can keep your application moving forward.</p>
          ${signOff}`),
      };
    case "interview_invitation":
      return {
        subject: `Interview Invitation — ${referenceNumber} | Legacy Path Solutions`,
        html: wrapEmail("You're Invited to an Introductory Interview", `
          <p>Dear ${applicantName},</p>
          <p>Congratulations! After reviewing your application, we would like to invite you to an <strong>introductory interview</strong> to discuss expectations, goals, and program fit.</p>
          ${refBadge(referenceNumber)}
          ${ctx.interviewDate ? `<p><strong>Proposed interview date:</strong> ${ctx.interviewDate}</p>` : ""}
          ${extra}
          <p>A member of our team will coordinate scheduling details with you shortly.</p>
          ${signOff}`),
      };
    case "application_approved":
      return {
        subject: `Congratulations — Your Application Is Approved! ${referenceNumber} | Legacy Path Solutions`,
        html: wrapEmail("Your Application Has Been Approved", `
          <p>Dear ${applicantName},</p>
          <p>We are delighted to inform you that your application to become a <strong>Legacy Path Solutions Support Specialist</strong> has been <strong style="color:#1a7f4e;">approved</strong>.</p>
          ${refBadge(referenceNumber)}
          <p>Your next steps are the independent contractor agreement and the $200 registration fee, which covers onboarding, training, systems access, and resources. Instructions will follow in a separate message.</p>
          ${extra}${signOff}`),
      };
    case "agreement_registration":
      return {
        subject: `Agreement & Registration Instructions — ${referenceNumber} | Legacy Path Solutions`,
        html: wrapEmail("Agreement & Registration Instructions", `
          <p>Dear ${applicantName},</p>
          <p>Welcome to the next phase of your journey with Legacy Path Solutions. Please complete the following two steps to secure your position:</p>
          ${refBadge(referenceNumber)}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4d8;"><strong style="color:#C9A227;">Step 1.</strong> <strong>Independent Contractor Agreement</strong> — review and sign the agreement that will be delivered to you.</td></tr>
            <tr><td style="padding:10px 0;"><strong style="color:#C9A227;">Step 2.</strong> <strong>$200 Registration Fee</strong> — covers onboarding, training, systems access, and resources. Payment instructions are included with your agreement packet. Payment does not guarantee assignments or income.</td></tr>
          </table>
          ${extra}
          <p>Once both steps are complete, you will receive your training invitation.</p>
          ${signOff}`),
      };
    case "training_invitation":
      return {
        subject: `Training Invitation — ${referenceNumber} | Legacy Path Solutions`,
        html: wrapEmail("You're Invited to Support Specialist Training", `
          <p>Dear ${applicantName},</p>
          <p>Your agreement and registration are complete — congratulations! You are now invited to begin <strong>Support Specialist training</strong>.</p>
          ${refBadge(referenceNumber)}
          <p>Training covers approved tools, materials, service knowledge, and the support resources you will use to serve families and older adults.</p>
          ${extra}
          <p>Details on accessing your training materials will be provided by our team.</p>
          ${signOff}`),
      };
    case "application_waitlisted":
      return {
        subject: `Application Update: Waitlisted — ${referenceNumber} | Legacy Path Solutions`,
        html: wrapEmail("Your Application Has Been Waitlisted", `
          <p>Dear ${applicantName},</p>
          <p>Thank you for your interest in the Support Specialist Program. After careful review, we have placed your application on our <strong>waitlist</strong>.</p>
          ${refBadge(referenceNumber)}
          <p>This is not a decline — openings in your service area may become available, and we will contact you as soon as an opportunity arises. No action or payment is needed at this time.</p>
          ${extra}${signOff}`),
      };
    case "application_declined":
      return {
        subject: `Application Update — ${referenceNumber} | Legacy Path Solutions`,
        html: wrapEmail("An Update on Your Application", `
          <p>Dear ${applicantName},</p>
          <p>Thank you for taking the time to apply to the Legacy Path Solutions Support Specialist Program. After careful consideration, we are unable to move forward with your application at this time.</p>
          ${refBadge(referenceNumber)}
          <p>This decision reflects current program capacity and alignment needs, not your professional worth. We encourage you to apply again in the future as our needs evolve.</p>
          ${extra}
          <p>We wish you every success in your professional journey.</p>
          ${signOff}`),
      };
    case "specialist_activated":
      return {
        subject: `Welcome Aboard — You're an Active Support Specialist! ${referenceNumber} | Legacy Path Solutions`,
        html: wrapEmail("Welcome, Support Specialist!", `
          <p>Dear ${applicantName},</p>
          <p><strong style="color:#1a7f4e;">Congratulations — you are officially an active Legacy Path Solutions Support Specialist!</strong></p>
          ${refBadge(referenceNumber)}
          <p>You now have access to approved tools, materials, and support resources. You are ready to help families take meaningful steps toward organization, protection, and intentional legacy planning.</p>
          ${extra}
          <p>Welcome to the team. We are honored to have you on this path with us.</p>
          ${signOff}`),
      };
  }
}

/** Save-and-continue resume email (utility, outside the 9 lifecycle templates) */
export function buildResumeEmail(applicantName: string, resumeLink: string): { subject: string; html: string } {
  return {
    subject: "Continue Your Application | Legacy Path Solutions",
    html: wrapEmail("Continue Your Application", `
      <p>Dear ${applicantName || "Applicant"},</p>
      <p>Your Support Specialist application has been saved. When you're ready, pick up right where you left off using the button below.</p>
      ${goldButton("Resume My Application", resumeLink)}
      <p style="font-size:13px;color:#6b7280;">Or copy this link into your browser:<br><a href="${resumeLink}" style="color:#0F2044;word-break:break-all;">${resumeLink}</a></p>
      ${signOff}`),
  };
}

/** Copy-of-application email sent to the applicant after submission */
export function buildApplicationCopyEmail(applicantName: string, referenceNumber: string, summaryHtml: string): { subject: string; html: string } {
  return {
    subject: `Your Application Copy — ${referenceNumber} | Legacy Path Solutions`,
    html: wrapEmail("A Copy of Your Completed Application", `
      <p>Dear ${applicantName},</p>
      <p>As requested, here is a copy of your completed Support Specialist application.</p>
      ${refBadge(referenceNumber)}
      ${summaryHtml}
      ${signOff}`),
  };
}
