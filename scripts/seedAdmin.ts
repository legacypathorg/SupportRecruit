/**
 * Creates (or updates the password for) an admin account.
 *
 * Usage:
 *   npx tsx scripts/seedAdmin.ts "admin@legacypathsolutions.com" "a-strong-password" "Admin Name"
 *
 * Requires DATABASE_URL to be set (e.g. `source .env` first, or run via
 * `dotenv -e .env -- npx tsx scripts/seedAdmin.ts ...`).
 */
import "dotenv/config";
import { hashPassword } from "../server/adminAuth";
import { getAdminByEmail, createAdminAccount, getDb } from "../server/db";

async function main() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password || !name) {
    console.error(
      'Usage: npx tsx scripts/seedAdmin.ts "email@example.com" "password" "Full Name"'
    );
    process.exit(1);
  }

  if (password.length < 10) {
    console.error("Password should be at least 10 characters.");
    process.exit(1);
  }

  const db = await getDb();
  if (!db) {
    console.error("Could not connect to the database. Check DATABASE_URL.");
    process.exit(1);
  }

  const existing = await getAdminByEmail(email);
  if (existing) {
    console.error(
      `An admin with email ${email} already exists (id ${existing.id}). ` +
        `This script only creates new accounts — update passwords directly in the database if needed.`
    );
    process.exit(1);
  }

  const passwordHash = hashPassword(password);
  const id = await createAdminAccount({
    email,
    passwordHash,
    name,
    isReviewer: true,
  });

  console.log(`Admin account created: ${name} <${email}> (id ${id})`);
  process.exit(0);
}

main().catch(err => {
  console.error("Failed to create admin account:", err);
  process.exit(1);
});
