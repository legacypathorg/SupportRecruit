import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import { TRPCError } from "@trpc/server";
import { getAdminByEmail, getAdminById } from "./db";

export const ADMIN_COOKIE = "lps_admin_session";
const SESSION_HOURS = 12;

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET || "lps-dev-secret");
}

export function hashPassword(password: string, salt?: string): string {
  const s = salt ?? randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${s}:${password}`).digest("hex");
  return `${s}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt] = stored.split(":");
  if (!salt) return false;
  const candidate = hashPassword(password, salt);
  const a = Buffer.from(candidate);
  const b = Buffer.from(stored);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createAdminSession(adminId: number): Promise<string> {
  return new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());
}

export async function getAdminFromRequest(req: Request) {
  const cookieHeader = req.headers.cookie ?? "";
  const match = cookieHeader.split(/;\s*/).find(c => c.startsWith(`${ADMIN_COOKIE}=`));
  if (!match) return null;
  const token = match.slice(ADMIN_COOKIE.length + 1);
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const adminId = payload.adminId as number;
    if (!adminId) return null;
    const admin = await getAdminById(adminId);
    return admin ?? null;
  } catch {
    return null;
  }
}

export function setAdminCookie(res: Response, token: string) {
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: SESSION_HOURS * 3600 * 1000,
  });
}

export function clearAdminCookie(res: Response) {
  res.cookie(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: -1,
  });
}

export async function loginAdmin(email: string, password: string) {
  const admin = await getAdminByEmail(email.toLowerCase().trim());
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password. Please try again." });
  }
  return admin;
}
