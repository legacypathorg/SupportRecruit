import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Legacy table from an earlier OAuth-based login flow that this app no longer
 * uses (admin auth is now handled entirely by `adminAccounts` below). Left in
 * place to avoid an unnecessary migration; safe to drop if you don't need it.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Admin accounts with simple email/password auth for the dashboard */
export const adminAccounts = mysqlTable("admin_accounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  isReviewer: boolean("isReviewer").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AdminAccount = typeof adminAccounts.$inferSelect;

export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  referenceNumber: varchar("referenceNumber", { length: 24 }).unique(),
  resumeToken: varchar("resumeToken", { length: 64 }).notNull().unique(),
  status: varchar("status", { length: 40 }).default("New Application").notNull(),
  isDraft: boolean("isDraft").default(true).notNull(),
  currentStep: int("currentStep").default(0).notNull(),
  // Step 1: personal info
  fullName: varchar("fullName", { length: 200 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  address1: varchar("address1", { length: 255 }),
  address2: varchar("address2", { length: 255 }),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 80 }),
  county: varchar("county", { length: 120 }),
  zip: varchar("zip", { length: 20 }),
  country: varchar("country", { length: 80 }).default("United States"),
  // Step 2: availability
  weeklyAvailability: varchar("weeklyAvailability", { length: 20 }),
  preferredDays: json("preferredDays").$type<string[]>(),
  independentWorkComfort: boolean("independentWorkComfort"),
  // Step 3: experience
  experienceAreas: json("experienceAreas").$type<string[]>(),
  profession: varchar("profession", { length: 160 }),
  industry: varchar("industry", { length: 120 }),
  experienceDescription: text("experienceDescription"),
  // Step 5: acknowledgments
  ackIndependentContractor: boolean("ackIndependentContractor"),
  ackNoLegalAdvice: boolean("ackNoLegalAdvice"),
  ackConfidentiality: boolean("ackConfidentiality"),
  ackPerformanceComp: boolean("ackPerformanceComp"),
  ackRegistrationFee: boolean("ackRegistrationFee"),
  ackFinalCertification: boolean("ackFinalCertification"),
  // Tracking fields (admin)
  reviewerId: int("reviewerId"),
  interviewDate: timestamp("interviewDate"),
  agreementStatus: varchar("agreementStatus", { length: 30 }).default("Not Started").notNull(),
  registrationFeeStatus: varchar("registrationFeeStatus", { length: 30 }).default("Not Started").notNull(),
  trainingStatus: varchar("trainingStatus", { length: 30 }).default("Not Started").notNull(),
  activationDate: timestamp("activationDate"),
  // Analytics
  trafficSource: varchar("trafficSource", { length: 160 }),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

export const applicationDocuments = mysqlTable("application_documents", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  docType: varchar("docType", { length: 40 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }),
  fileSize: int("fileSize"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});
export type ApplicationDocument = typeof applicationDocuments.$inferSelect;

export const internalNotes = mysqlTable("internal_notes", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  adminId: int("adminId").notNull(),
  adminName: varchar("adminName", { length: 120 }).notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InternalNote = typeof internalNotes.$inferSelect;

export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  actor: varchar("actor", { length: 160 }).notNull(),
  action: varchar("action", { length: 60 }).notNull(),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ActivityEntry = typeof activityLog.$inferSelect;

export const emailLog = mysqlTable("email_log", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId"),
  templateKey: varchar("templateKey", { length: 60 }).notNull(),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 300 }).notNull(),
  htmlBody: text("htmlBody"),
  deliveryStatus: varchar("deliveryStatus", { length: 30 }).default("logged").notNull(),
  sentBy: varchar("sentBy", { length: 160 }).default("system").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailLogEntry = typeof emailLog.$inferSelect;

export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 60 }).notNull(),
  sessionId: varchar("sessionId", { length: 64 }),
  applicationId: int("applicationId"),
  trafficSource: varchar("trafficSource", { length: 160 }),
  metadata: json("metadata").$type<Record<string, string | number>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
