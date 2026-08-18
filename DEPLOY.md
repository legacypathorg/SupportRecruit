# Deploying Legacy Path Solutions off Manus

This app is now a plain Node.js/TypeScript app (Express + tRPC + React/Vite + MySQL
via Drizzle). It has no dependency on Manus. This guide covers the fastest stable
path to production: **Railway**, with notes for Render and a plain VPS as alternatives.

## 1. Set up object storage (do this first)

Pick one:
- **AWS S3** — create a bucket, an IAM user with `s3:PutObject`/`s3:GetObject`/`s3:DeleteObject`
  scoped to that bucket, and a key pair. Leave `S3_ENDPOINT` blank.
- **Cloudflare R2** (cheaper, no egress fees) — create a bucket under R2, create an
  API token with object read/write, set `S3_ENDPOINT` to
  `https://<account_id>.r2.cloudflarestorage.com`.
- **Backblaze B2** — similar; set `S3_ENDPOINT` to your region's B2 S3 endpoint.

**Important**: the app's current logo/hero image references
(`lps-logo_5661e8c7.png`, `lps-official-logo_e6ab5a99.png`, `lps-hero_8ff4aab6.png`,
`lps-secondary_29a28996.png`) point to files that lived in Manus's old bucket. Upload
your logo and hero images to your new bucket under those exact same keys, or update
the `LOGO_URL` / `HERO_URL` / `SECONDARY_URL` constants in:
- `client/src/components/SiteHeader.tsx`
- `client/src/components/SiteFooter.tsx`
- `client/src/components/AdminLayout.tsx`
- `client/src/pages/AdminLogin.tsx`
- `client/src/pages/Home.tsx`

## 2. Set up MySQL

Any standard MySQL 8+ works. Options, easiest first:
- **Railway** — add a MySQL service in the same project as your app (one click).
- **PlanetScale** — serverless MySQL, generous free tier.
- **Render** — managed MySQL add-on.

Copy the connection string into `DATABASE_URL`.

## 3. Configure environment variables

Copy `.env.example` to `.env` locally to test, and set the same variables in your
host's dashboard for production:

- `DATABASE_URL`
- `JWT_SECRET` — generate with `openssl rand -hex 32`
- `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` (if not AWS), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` — you already have these from the Resend
  setup you did on Manus (`legacypathsolutions.com` is verified — nothing to redo)
- `PUBLIC_APP_URL` — your production URL, e.g. `https://apply.legacypathsolutions.com`
- `OWNER_NOTIFICATION_EMAIL` — optional, where new-application alerts go

## 4. Run database migrations

```bash
pnpm install
pnpm db:push
```

This applies `drizzle/schema.ts` to your new database. It creates the `applications`,
`admin_accounts`, `application_documents`, `internal_notes`, `activity_log`,
`email_log`, and `analytics_events` tables.

Then create your first admin login:

```bash
pnpm seed:admin "you@legacypathsolutions.com" "a-strong-password" "Your Name"
```

Requires `DATABASE_URL` to be set in your environment (or `.env`) first.

## 5. Deploy — Railway (recommended)

1. Push this project to a GitHub repo.
2. In Railway: New Project → Deploy from GitHub repo.
3. Add a MySQL plugin to the same project (or point `DATABASE_URL` at PlanetScale).
4. Set the environment variables from step 3 in Railway's Variables tab.
5. Railway auto-detects `pnpm build` / `pnpm start` from `package.json`. Confirm:
   - Build command: `pnpm build`
   - Start command: `pnpm start`
6. Once deployed, point your domain (e.g. `legacypathsupport.com` or whatever domain
   hosts the apply funnel) at Railway's generated domain via a CNAME, or add a custom
   domain directly in Railway's settings.

### Alternative: Render
Same shape — "New Web Service" from your repo, add a managed MySQL/Postgres instance
(swap to Postgres would require schema changes, so stick with an external MySQL like
PlanetScale if you go this route), set the same env vars, build/start commands as above.

### Alternative: plain VPS (DigitalOcean/Hetzner)
More control, more upkeep. Rough shape:
```bash
git clone <your-repo>
cd legacy-path-specialist
pnpm install
pnpm build
pnpm db:push
pm2 start dist/index.js --name legacy-path
```
Put Caddy or nginx in front for TLS + your domain.

## 6. Point your recruitment site at it

Update whatever links from `legacypathsupport` (subdomain/site) to `/apply` to point
at your new host's URL once DNS is switched over. No code changes needed there — the
app itself is the whole apply funnel + admin dashboard.

## What changed from the Manus version (for your records)

- File storage now talks directly to S3-compatible storage instead of Manus's
  "Forge" proxy — see `server/storage.ts` and `server/_core/storageProxy.ts`.
- Removed all Manus-only code: OAuth login (was unused — your admin login is
  separate), AI-feature scaffolding (LLM/image-gen/voice, unused), heartbeat/cron
  helpers (unused), and the Manus dev-mode Vite plugin.
- `server/routers/application.ts` — this file was missing from the export you gave
  me (referenced by the app but not included in the zip). I rebuilt it from the
  database schema and the client's existing calls to match the original behavior
  (draft save/resume, document upload, submission, resume-link emails, analytics).
  **Test the full apply flow end-to-end before pointing real applicant traffic at
  it** — the reconstruction should be functionally equivalent, but it wasn't copied
  from your original source, so treat it as newly written code that needs review,
  same as anything else before a production launch.
