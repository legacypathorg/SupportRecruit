import { and, desc, eq, gte, like, lte, or, sql, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activityLog,
  adminAccounts,
  analyticsEvents,
  applicationDocuments,
  applications,
  emailLog,
  internalNotes,
  InsertApplication,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

/* ---------------- Applications ---------------- */

export async function createDraftApplication(data: InsertApplication) {
  const db = await requireDb();
  const [result] = await db.insert(applications).values(data);
  return result.insertId;
}

export async function updateApplication(id: number, data: Partial<InsertApplication>) {
  const db = await requireDb();
  await db.update(applications).set(data).where(eq(applications.id, id));
}

export async function getApplicationById(id: number) {
  const db = await requireDb();
  const rows = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return rows[0];
}

export async function getApplicationByToken(resumeToken: string) {
  const db = await requireDb();
  const rows = await db.select().from(applications).where(eq(applications.resumeToken, resumeToken)).limit(1);
  return rows[0];
}

export async function getApplicationByReference(referenceNumber: string) {
  const db = await requireDb();
  const rows = await db.select().from(applications).where(eq(applications.referenceNumber, referenceNumber)).limit(1);
  return rows[0];
}

export interface ApplicationFilters {
  search?: string;
  status?: string;
  state?: string;
  city?: string;
  county?: string;
  industry?: string;
  submittedFrom?: Date;
  submittedTo?: Date;
  reviewerId?: number;
  includeDrafts?: boolean;
  page?: number;
  pageSize?: number;
}

function buildApplicationConditions(f: ApplicationFilters): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  if (!f.includeDrafts) conds.push(eq(applications.isDraft, false));
  if (f.search) {
    const term = `%${f.search}%`;
    conds.push(
      or(
        like(applications.fullName, term),
        like(applications.email, term),
        like(applications.city, term),
        like(applications.state, term),
        like(applications.county, term),
        like(applications.profession, term),
        like(applications.status, term),
        like(applications.referenceNumber, term),
      ),
    );
  }
  if (f.status) conds.push(eq(applications.status, f.status));
  if (f.state) conds.push(eq(applications.state, f.state));
  if (f.city) conds.push(like(applications.city, `%${f.city}%`));
  if (f.county) conds.push(like(applications.county, `%${f.county}%`));
  if (f.industry) conds.push(like(applications.industry, `%${f.industry}%`));
  if (f.submittedFrom) conds.push(gte(applications.submittedAt, f.submittedFrom));
  if (f.submittedTo) conds.push(lte(applications.submittedAt, f.submittedTo));
  if (f.reviewerId) conds.push(eq(applications.reviewerId, f.reviewerId));
  const filtered = conds.filter((c): c is SQL => !!c);
  return filtered.length ? and(...filtered) : undefined;
}

export async function listApplications(f: ApplicationFilters) {
  const db = await requireDb();
  const where = buildApplicationConditions(f);
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 20;

  const countQuery = db.select({ count: sql<number>`count(*)` }).from(applications);
  const [{ count }] = where ? await countQuery.where(where) : await countQuery;

  let query = db
    .select()
    .from(applications)
    .orderBy(desc(applications.submittedAt), desc(applications.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .$dynamic();
  if (where) query = query.where(where);
  const rows = await query;

  return { rows, total: Number(count), page, pageSize };
}

export async function listAllApplicationsForExport(f: ApplicationFilters) {
  const db = await requireDb();
  const where = buildApplicationConditions(f);
  let query = db.select().from(applications).orderBy(desc(applications.submittedAt)).$dynamic();
  if (where) query = query.where(where);
  return query;
}

/* ---------------- Documents ---------------- */

export async function addDocument(doc: typeof applicationDocuments.$inferInsert) {
  const db = await requireDb();
  const [result] = await db.insert(applicationDocuments).values(doc);
  return result.insertId;
}

export async function getDocumentsByApplication(applicationId: number) {
  const db = await requireDb();
  return db.select().from(applicationDocuments).where(eq(applicationDocuments.applicationId, applicationId));
}

export async function getDocumentById(id: number) {
  const db = await requireDb();
  const rows = await db.select().from(applicationDocuments).where(eq(applicationDocuments.id, id)).limit(1);
  return rows[0];
}

export async function deleteDocument(id: number) {
  const db = await requireDb();
  await db.delete(applicationDocuments).where(eq(applicationDocuments.id, id));
}

/* ---------------- Notes ---------------- */

export async function addNote(note: typeof internalNotes.$inferInsert) {
  const db = await requireDb();
  const [result] = await db.insert(internalNotes).values(note);
  return result.insertId;
}

export async function getNotesByApplication(applicationId: number) {
  const db = await requireDb();
  return db.select().from(internalNotes).where(eq(internalNotes.applicationId, applicationId)).orderBy(desc(internalNotes.createdAt));
}

/* ---------------- Activity Log ---------------- */

export async function logActivity(entry: typeof activityLog.$inferInsert) {
  const db = await requireDb();
  await db.insert(activityLog).values(entry);
}

export async function getActivityByApplication(applicationId: number) {
  const db = await requireDb();
  return db.select().from(activityLog).where(eq(activityLog.applicationId, applicationId)).orderBy(desc(activityLog.createdAt));
}

/* ---------------- Email Log ---------------- */

export async function getEmailsByApplication(applicationId: number) {
  const db = await requireDb();
  return db.select().from(emailLog).where(eq(emailLog.applicationId, applicationId)).orderBy(desc(emailLog.createdAt));
}

/* ---------------- Analytics ---------------- */

export async function recordAnalyticsEvent(event: typeof analyticsEvents.$inferInsert) {
  const db = await requireDb();
  await db.insert(analyticsEvents).values(event);
}

export async function getAnalyticsSummary() {
  const db = await requireDb();
  const counts = await db
    .select({ eventType: analyticsEvents.eventType, count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .groupBy(analyticsEvents.eventType);
  const sources = await db
    .select({ source: analyticsEvents.trafficSource, count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.eventType, "form_start"))
    .groupBy(analyticsEvents.trafficSource);
  const statusCounts = await db
    .select({ status: applications.status, count: sql<number>`count(*)` })
    .from(applications)
    .where(eq(applications.isDraft, false))
    .groupBy(applications.status);
  const [draftInfo] = await db
    .select({ drafts: sql<number>`sum(case when isDraft = 1 then 1 else 0 end)`, submitted: sql<number>`sum(case when isDraft = 0 then 1 else 0 end)` })
    .from(applications);
  return { counts, sources, statusCounts, draftInfo };
}

/* ---------------- Admin Accounts ---------------- */

export async function getAdminByEmail(email: string) {
  const db = await requireDb();
  const rows = await db.select().from(adminAccounts).where(eq(adminAccounts.email, email)).limit(1);
  return rows[0];
}

export async function getAdminById(id: number) {
  const db = await requireDb();
  const rows = await db.select().from(adminAccounts).where(eq(adminAccounts.id, id)).limit(1);
  return rows[0];
}

export async function listAdmins() {
  const db = await requireDb();
  return db.select({ id: adminAccounts.id, name: adminAccounts.name, email: adminAccounts.email, isReviewer: adminAccounts.isReviewer }).from(adminAccounts);
}

export async function createAdminAccount(data: typeof adminAccounts.$inferInsert) {
  const db = await requireDb();
  const [result] = await db.insert(adminAccounts).values(data);
  return result.insertId;
}
