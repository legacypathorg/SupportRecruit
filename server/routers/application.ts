import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { generateReferenceNumber, generateResumeToken } from "../referenceNumber";
import { buildEmail } from "../emailTemplates";
import { sendEmail } from "../emailService";
import { storagePut } from "../storage";
import {
  DOCUMENT_TYPES,
  EXPERIENCE_OPTIONS,
  WEEKLY_AVAILABILITY,
  WORKING_DAYS,
} from "@shared/lps";

const draftFieldsSchema = z.object({
  fullName: z.string().max(200).optional(),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(40).optional(),
  address1: z.string().max(255).optional(),
  address2: z.string().max(255).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(80).optional(),
  county: z.string().max(120).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().max(80).optional(),
  weeklyAvailability: z.enum(WEEKLY_AVAILABILITY).optional(),
  preferredDays: z.array(z.enum(WORKING_DAYS)).optional(),
  independentWorkComfort: z.boolean().optional(),
  experienceAreas: z.array(z.enum(EXPERIENCE_OPTIONS)).optional(),
  profession: z.string().max(160).optional(),
  industry: z.string().max(120).optional(),
  experienceDescription: z.string().optional(),
  ackIndependentContractor: z.boolean().optional(),
  ackNoLegalAdvice: z.boolean().optional(),
  ackConfidentiality: z.boolean().optional(),
  ackPerformanceComp: z.boolean().optional(),
  ackRegistrationFee: z.boolean().optional(),
  ackFinalCertification: z.boolean().optional(),
  currentStep: z.number().int().min(0).optional(),
});

const submitFieldsSchema = draftFieldsSchema.extend({
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().min(1).max(40),
  address1: z.string().min(1).max(255),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(80),
  zip: z.string().min(1).max(20),
  country: z.string().min(1).max(80),
  weeklyAvailability: z.enum(WEEKLY_AVAILABILITY),
  preferredDays: z.array(z.enum(WORKING_DAYS)).min(1),
  experienceAreas: z.array(z.enum(EXPERIENCE_OPTIONS)).min(1),
  profession: z.string().min(1).max(160),
  ackIndependentContractor: z.literal(true),
  ackNoLegalAdvice: z.literal(true),
  ackConfidentiality: z.literal(true),
  ackPerformanceComp: z.literal(true),
  ackRegistrationFee: z.literal(true),
  ackFinalCertification: z.literal(true),
});

async function getDraftOrThrow(resumeToken: string) {
  const app = await db.getApplicationByToken(resumeToken);
  if (!app) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
  }
  return app;
}

export const applicationRouter = router({
  start: publicProcedure
    .input(
      z.object({
        sessionId: z.string().max(64).optional(),
        trafficSource: z.string().max(160).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const resumeToken = generateResumeToken();
      const applicationId = await db.createDraftApplication({
        resumeToken,
        trafficSource: input.trafficSource,
      });
      await db.logActivity({
        applicationId,
        actor: "Applicant",
        action: "form_start",
        detail: "Application started",
      });
      return { resumeToken, applicationId };
    }),

  saveDraft: publicProcedure
    .input(
      z.object({
        resumeToken: z.string().min(1),
        fields: draftFieldsSchema,
      })
    )
    .mutation(async ({ input }) => {
      const app = await getDraftOrThrow(input.resumeToken);
      await db.updateApplication(app.id, {
        ...input.fields,
        currentStep: input.fields.currentStep ?? app.currentStep,
      });
      return { success: true } as const;
    }),

  emailResumeLink: publicProcedure
    .input(z.object({ resumeToken: z.string().min(1), email: z.string().email() }))
    .mutation(async ({ input }) => {
      const app = await getDraftOrThrow(input.resumeToken);
      const appUrl = process.env.PUBLIC_APP_URL || "";
      const resumeLink = `${appUrl}/apply?resume=${input.resumeToken}`;

      const { subject, html } = buildEmail("application_received", {
        applicantName: app.fullName || "there",
        referenceNumber: app.referenceNumber || "Not yet assigned",
        resumeLink,
        extraMessage:
          "Use the link below any time to pick up your Support Specialist application right where you left off.",
      });

      const result = await sendEmail({
        to: input.email,
        subject: `Continue your Legacy Path Solutions application`,
        html,
        templateKey: "application_received",
        applicationId: app.id,
        sentBy: "system",
      });

      await db.logActivity({
        applicationId: app.id,
        actor: "Applicant",
        action: "resume_link_sent",
        detail: `Sent to ${input.email}`,
      });
      return { success: result.delivered || result.logged };
    }),

  uploadDocument: publicProcedure
    .input(
      z.object({
        resumeToken: z.string().min(1),
        docType: z.enum(DOCUMENT_TYPES),
        fileName: z.string().min(1).max(255),
        mimeType: z.string().max(120),
        base64Data: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const app = await getDraftOrThrow(input.resumeToken);

      const buffer = Buffer.from(input.base64Data, "base64");
      const MAX_BYTES = 15 * 1024 * 1024; // 15MB
      if (buffer.byteLength > MAX_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "File is too large (15MB max)." });
      }

      const { key } = await storagePut(
        `applications/${app.resumeToken}/${input.fileName}`,
        buffer,
        input.mimeType || "application/octet-stream"
      );

      const documentId = await db.addDocument({
        applicationId: app.id,
        docType: input.docType,
        fileName: input.fileName,
        fileKey: key,
        mimeType: input.mimeType,
        fileSize: buffer.byteLength,
      });

      await db.logActivity({
        applicationId: app.id,
        actor: "Applicant",
        action: "document_uploaded",
        detail: `${input.docType}: ${input.fileName}`,
      });

      return {
        documentId,
        docType: input.docType,
        fileName: input.fileName,
        fileSize: buffer.byteLength,
      };
    }),

  removeDocument: publicProcedure
    .input(z.object({ resumeToken: z.string().min(1), documentId: z.number().int() }))
    .mutation(async ({ input }) => {
      const app = await getDraftOrThrow(input.resumeToken);
      const doc = await db.getDocumentById(input.documentId);
      if (!doc || doc.applicationId !== app.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found." });
      }
      await db.deleteDocument(input.documentId);
      await db.logActivity({
        applicationId: app.id,
        actor: "Applicant",
        action: "document_removed",
        detail: `Document #${input.documentId}`,
      });
      return { success: true } as const;
    }),

  submit: publicProcedure
    .input(
      z.object({
        resumeToken: z.string().min(1),
        fields: submitFieldsSchema,
      })
    )
    .mutation(async ({ input }) => {
      const app = await getDraftOrThrow(input.resumeToken);
      if (!app.isDraft) {
        return { referenceNumber: app.referenceNumber! };
      }

      const referenceNumber = generateReferenceNumber();

      await db.updateApplication(app.id, {
        ...input.fields,
        referenceNumber,
        isDraft: false,
        status: "New Application",
        submittedAt: new Date(),
      });

      await db.logActivity({
        applicationId: app.id,
        actor: "Applicant",
        action: "submitted",
        detail: `Reference ${referenceNumber}`,
      });

      const { subject, html } = buildEmail("application_received", {
        applicantName: input.fields.fullName,
        referenceNumber,
      });

      await sendEmail({
        to: input.fields.email,
        subject,
        html,
        templateKey: "application_received",
        applicationId: app.id,
        sentBy: "system",
      });

      const ownerEmail = process.env.OWNER_NOTIFICATION_EMAIL;
      if (ownerEmail) {
        await sendEmail({
          to: ownerEmail,
          subject: `New Support Specialist application: ${input.fields.fullName}`,
          html: `<p>New application submitted.</p><p>Reference: ${referenceNumber}<br/>Name: ${input.fields.fullName}<br/>Email: ${input.fields.email}</p>`,
          templateKey: "application_received",
          applicationId: app.id,
          sentBy: "system",
        });
      }

      return { referenceNumber };
    }),

  emailCopy: publicProcedure
    .input(z.object({ resumeToken: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const app = await getDraftOrThrow(input.resumeToken);
      if (!app.email) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No email on file for this application." });
      }

      const { subject, html } = buildEmail("application_received", {
        applicantName: app.fullName || "there",
        referenceNumber: app.referenceNumber || "Pending",
        extraMessage: "This is a copy of your submitted application details for your records.",
      });

      const result = await sendEmail({
        to: app.email,
        subject: `Your Legacy Path Solutions application copy`,
        html,
        templateKey: "application_received",
        applicationId: app.id,
        sentBy: "system",
      });

      return { success: result.delivered || result.logged };
    }),

  trackEvent: publicProcedure
    .input(
      z.object({
        eventType: z.string().min(1).max(60),
        sessionId: z.string().max(64).optional(),
        resumeToken: z.string().optional(),
        trafficSource: z.string().max(160).optional(),
        metadata: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
      })
    )
    .mutation(async ({ input }) => {
      let applicationId: number | undefined;
      if (input.resumeToken) {
        const app = await db.getApplicationByToken(input.resumeToken);
        applicationId = app?.id;
      }
      await db.recordAnalyticsEvent({
        eventType: input.eventType,
        sessionId: input.sessionId,
        applicationId,
        trafficSource: input.trafficSource,
        metadata: input.metadata,
      });
      return { success: true } as const;
    }),
});
