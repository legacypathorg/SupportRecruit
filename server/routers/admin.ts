import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import {
  clearAdminCookie,
  createAdminSession,
  getAdminFromRequest,
  loginAdmin,
  setAdminCookie,
} from "../adminAuth";
import { buildEmail } from "../emailTemplates";
import { sendEmail } from "../emailService";
import { storageGetSignedUrl } from "../storage";
import {
  APPLICATION_STATUSES,
  EMAIL_TEMPLATE_KEYS,
  MILESTONE_STATUS,
  STATUS_EMAIL_MAP,
  type ApplicationStatus,
  type EmailTemplateKey,
} from "../../shared/lps";

/** Middleware-style guard: resolves the admin from the session cookie or throws */
const adminSessionProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const admin = await getAdminFromRequest(ctx.req);
  if (!admin) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to access the admin dashboard." });
  return next({ ctx: { ...ctx, admin } });
});

const filtersSchema = z.object({
  search: z.string().max(200).optional(),
  status: z.string().max(40).optional(),
  state: z.string().max(80).optional(),
  city: z.string().max(120).optional(),
  county: z.string().max(120).optional(),
  industry: z.string().max(120).optional(),
  submittedFrom: z.date().optional(),
  submittedTo: z.date().optional(),
  reviewerId: z.number().int().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(100).default(20),
});

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const adminRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email("Please enter a valid email."), password: z.string().min(1, "Password is required.") }))
    .mutation(async ({ input, ctx }) => {
      const admin = await loginAdmin(input.email, input.password);
      const token = await createAdminSession(admin.id);
      setAdminCookie(ctx.res, token);
      return { id: admin.id, name: admin.name, email: admin.email };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    clearAdminCookie(ctx.res);
    return { success: true };
  }),

  me: publicProcedure.query(async ({ ctx }) => {
    const admin = await getAdminFromRequest(ctx.req);
    return admin ? { id: admin.id, name: admin.name, email: admin.email } : null;
  }),

  reviewers: adminSessionProcedure.query(() => db.listAdmins()),

  list: adminSessionProcedure.input(filtersSchema).query(async ({ input }) => {
    return db.listApplications(input);
  }),

  exportCsv: adminSessionProcedure.input(filtersSchema.omit({ page: true, pageSize: true })).mutation(async ({ input }) => {
    const rows = await db.listAllApplicationsForExport(input);
    const admins = await db.listAdmins();
    const adminMap = new Map(admins.map(a => [a.id, a.name]));
    const headers = [
      "Reference Number", "Status", "Full Name", "Email", "Phone", "Address 1", "Address 2", "City", "State", "County", "Zip", "Country",
      "Weekly Availability", "Preferred Days", "Independent Work Comfort", "Experience Areas", "Profession", "Industry", "Experience Description",
      "Reviewer", "Interview Date", "Agreement Status", "Registration Fee Status", "Training Status", "Activation Date",
      "Traffic Source", "Submitted At",
    ];
    const lines = rows.map(r => [
      r.referenceNumber, r.status, r.fullName, r.email, r.phone, r.address1, r.address2, r.city, r.state, r.county, r.zip, r.country,
      r.weeklyAvailability, (r.preferredDays ?? []).join("; "), r.independentWorkComfort == null ? "" : r.independentWorkComfort ? "Yes" : "No",
      (r.experienceAreas ?? []).join("; "), r.profession, r.industry, r.experienceDescription,
      r.reviewerId ? adminMap.get(r.reviewerId) ?? "" : "", r.interviewDate?.toISOString() ?? "", r.agreementStatus, r.registrationFeeStatus,
      r.trainingStatus, r.activationDate?.toISOString() ?? "", r.trafficSource, r.submittedAt?.toISOString() ?? "",
    ].map(csvEscape).join(","));
    return { csv: [headers.join(","), ...lines].join("\n"), count: rows.length };
  }),

  detail: adminSessionProcedure.input(z.object({ id: z.number().int() })).query(async ({ input }) => {
    const application = await db.getApplicationById(input.id);
    if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
    const [documents, notes, activity, emails, admins] = await Promise.all([
      db.getDocumentsByApplication(input.id),
      db.getNotesByApplication(input.id),
      db.getActivityByApplication(input.id),
      db.getEmailsByApplication(input.id),
      db.listAdmins(),
    ]);
    return { application, documents, notes, activity, emails, admins };
  }),

  updateStatus: adminSessionProcedure
    .input(z.object({ id: z.number().int(), status: z.enum(APPLICATION_STATUSES), sendEmail: z.boolean().default(true), extraMessage: z.string().max(3000).optional() }))
    .mutation(async ({ input, ctx }) => {
      const app = await db.getApplicationById(input.id);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
      const prev = app.status;
      const updates: Record<string, unknown> = { status: input.status };
      if (input.status === "Active Support Specialist" && !app.activationDate) updates.activationDate = new Date();
      await db.updateApplication(input.id, updates);
      await db.logActivity({ applicationId: input.id, actor: ctx.admin.name, action: "Status Changed", detail: `${prev} → ${input.status}` });

      let emailSent = false;
      const templateKey = STATUS_EMAIL_MAP[input.status as ApplicationStatus];
      if (input.sendEmail && templateKey && app.email && app.referenceNumber) {
        const { subject, html } = buildEmail(templateKey, {
          applicantName: app.fullName ?? "Applicant",
          referenceNumber: app.referenceNumber,
          extraMessage: input.extraMessage,
          interviewDate: app.interviewDate ? app.interviewDate.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }) : undefined,
        });
        const result = await sendEmail({ to: app.email, subject, html, templateKey, applicationId: input.id, sentBy: ctx.admin.name });
        emailSent = result.logged;
        await db.logActivity({ applicationId: input.id, actor: ctx.admin.name, action: "Email Sent", detail: `${templateKey} to ${app.email}` });
      }
      return { updated: true, emailSent };
    }),

  assignReviewer: adminSessionProcedure
    .input(z.object({ id: z.number().int(), reviewerId: z.number().int().nullable() }))
    .mutation(async ({ input, ctx }) => {
      const app = await db.getApplicationById(input.id);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
      let reviewerName = "Unassigned";
      if (input.reviewerId) {
        const reviewer = await db.getAdminById(input.reviewerId);
        if (!reviewer) throw new TRPCError({ code: "NOT_FOUND", message: "Reviewer not found." });
        reviewerName = reviewer.name;
      }
      await db.updateApplication(input.id, { reviewerId: input.reviewerId });
      await db.logActivity({ applicationId: input.id, actor: ctx.admin.name, action: "Reviewer Assigned", detail: reviewerName });
      return { updated: true };
    }),

  addNote: adminSessionProcedure
    .input(z.object({ id: z.number().int(), note: z.string().min(1, "Note cannot be empty.").max(5000) }))
    .mutation(async ({ input, ctx }) => {
      await db.addNote({ applicationId: input.id, adminId: ctx.admin.id, adminName: ctx.admin.name, note: input.note });
      await db.logActivity({ applicationId: input.id, actor: ctx.admin.name, action: "Note Added", detail: input.note.slice(0, 120) });
      return { added: true };
    }),

  updateTracking: adminSessionProcedure
    .input(z.object({
      id: z.number().int(),
      interviewDate: z.date().nullable().optional(),
      agreementStatus: z.enum(MILESTONE_STATUS).optional(),
      registrationFeeStatus: z.enum(MILESTONE_STATUS).optional(),
      trainingStatus: z.enum(MILESTONE_STATUS).optional(),
      activationDate: z.date().nullable().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...fields } = input;
      const app = await db.getApplicationById(id);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
      const changes: string[] = [];
      if (fields.interviewDate !== undefined) changes.push(`Interview date: ${fields.interviewDate ? fields.interviewDate.toLocaleString() : "cleared"}`);
      if (fields.agreementStatus) changes.push(`Agreement: ${fields.agreementStatus}`);
      if (fields.registrationFeeStatus) changes.push(`Registration fee: ${fields.registrationFeeStatus}`);
      if (fields.trainingStatus) changes.push(`Training: ${fields.trainingStatus}`);
      if (fields.activationDate !== undefined) changes.push(`Activation date: ${fields.activationDate ? fields.activationDate.toLocaleDateString() : "cleared"}`);
      await db.updateApplication(id, fields);
      await db.logActivity({ applicationId: id, actor: ctx.admin.name, action: "Tracking Updated", detail: changes.join("; ") });
      return { updated: true };
    }),

  documentUrl: adminSessionProcedure
    .input(z.object({ documentId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const doc = await db.getDocumentById(input.documentId);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found." });
      const url = await storageGetSignedUrl(doc.fileKey); // presigned download URL
      await db.logActivity({ applicationId: doc.applicationId, actor: ctx.admin.name, action: "Document Downloaded", detail: doc.fileName });
      return { url, fileName: doc.fileName };
    }),

  sendTemplatedEmail: adminSessionProcedure
    .input(z.object({ id: z.number().int(), templateKey: z.enum(EMAIL_TEMPLATE_KEYS), extraMessage: z.string().max(3000).optional() }))
    .mutation(async ({ input, ctx }) => {
      const app = await db.getApplicationById(input.id);
      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
      if (!app.email) throw new TRPCError({ code: "BAD_REQUEST", message: "This applicant has no email address on file." });
      const { subject, html } = buildEmail(input.templateKey as EmailTemplateKey, {
        applicantName: app.fullName ?? "Applicant",
        referenceNumber: app.referenceNumber ?? "PENDING",
        extraMessage: input.extraMessage,
        interviewDate: app.interviewDate ? app.interviewDate.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" }) : undefined,
      });
      await sendEmail({ to: app.email, subject, html, templateKey: input.templateKey, applicationId: input.id, sentBy: ctx.admin.name });
      await db.logActivity({ applicationId: input.id, actor: ctx.admin.name, action: "Email Sent", detail: `${input.templateKey} to ${app.email}` });
      return { sent: true };
    }),

  previewEmail: adminSessionProcedure
    .input(z.object({ templateKey: z.enum(EMAIL_TEMPLATE_KEYS), applicantName: z.string().default("Jane Doe"), referenceNumber: z.string().default("LPS-2026-SAMPLE") }))
    .query(({ input }) => {
      return buildEmail(input.templateKey as EmailTemplateKey, {
        applicantName: input.applicantName,
        referenceNumber: input.referenceNumber,
      });
    }),

  analytics: adminSessionProcedure.query(async () => {
    const summary = await db.getAnalyticsSummary();
    const get = (type: string) => Number(summary.counts.find(c => c.eventType === type)?.count ?? 0);
    const starts = get("form_start");
    const submits = get("form_submit");
    return {
      starts,
      submits,
      ctaClicks: get("cta_click"),
      savesForLater: get("save_for_later"),
      completionRate: starts > 0 ? Math.round((submits / starts) * 100) : 0,
      abandonmentRate: starts > 0 ? Math.round(((starts - submits) / starts) * 100) : 0,
      sources: summary.sources.map(s => ({ source: s.source ?? "direct", count: Number(s.count) })),
      statusCounts: summary.statusCounts.map(s => ({ status: s.status, count: Number(s.count) })),
      drafts: Number(summary.draftInfo?.drafts ?? 0),
      submitted: Number(summary.draftInfo?.submitted ?? 0),
    };
  }),
});
