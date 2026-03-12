# Installation

Three ways to get running — pick the one that fits.

| Path | Time | Requirements |
|------|------|-------------|
| [Vercel One-Click](#vercel-one-click) | ~3 min | Neon account |
| [Docker Compose](#docker-compose) | ~5 min | Docker |
| [Local Development](#local-development) | ~10 min | Node.js 18+, PostgreSQL |

Only **two env vars** are required: `DATABASE_URL` and `AUTH_SECRET`. Everything else (Stripe, Resend, AI, OAuth) is optional and can be added later.

---

## Vercel One-Click

1. Click the button:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyuens1002%2Fartisan-roast&env=DATABASE_URL,AUTH_SECRET,SEED_ON_BUILD&envDescription=DATABASE_URL%3A%20Neon%20PostgreSQL%20connection%20string.%20AUTH_SECRET%3A%20Run%20%27openssl%20rand%20-base64%2032%27.%20SEED_ON_BUILD%3A%20Set%20to%20%27true%27%20for%20demo%20data.&envLink=https%3A%2F%2Fgithub.com%2Fyuens1002%2Fartisan-roast%2Fblob%2Fmain%2F.env.example&project-name=artisan-roast&repository-name=artisan-roast)

2. Fill in the env vars when prompted:
   - `DATABASE_URL` — Get a free Postgres DB at [neon.tech](https://neon.tech), copy the pooled connection string
   - `AUTH_SECRET` — Run `openssl rand -base64 32` in your terminal
   - `SEED_ON_BUILD` — Set to `true` so the store has demo products on first deploy

3. Visit your store at `https://your-project.vercel.app`

**What's next:** [Add optional integrations](#optional-integrations) (payments, email, AI, OAuth).

---

## Docker Compose

Prerequisites: Docker and Docker Compose installed.

1. Clone the repo:

   ```bash
   git clone https://github.com/yuens1002/artisan-roast.git
   cd artisan-roast
   ```

2. Create your env file:

   ```bash
   cp .env.docker.example .env.docker
   ```

   Edit `.env.docker` — set at minimum:
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - (DATABASE_URL is pre-configured to use the Docker Postgres container)

3. Start everything:

   ```bash
   docker compose up --build -d
   ```

   This runs Postgres, migrates the schema, seeds demo data if the DB is empty, builds the app, and starts it.

4. Visit `http://localhost:3000`

To create an admin user:

```bash
docker compose run --rm app npm run setup -- --email=owner@shop.com --password=changeme
```

**What's next:** [Add optional integrations](#optional-integrations) (payments, email, AI, OAuth).

---

## Local Development

Prerequisites: Node.js 18+, npm, Git, and a PostgreSQL database (local or managed).

1. Clone and install:

   ```bash
   git clone https://github.com/yuens1002/artisan-roast.git
   cd artisan-roast
   npm install
   cp .env.example .env.local
   ```

2. Configure `.env.local` (minimum):
   - `DATABASE_URL` — Your Postgres connection string
   - `AUTH_SECRET` — `openssl rand -base64 32`

3. Run the setup script (creates schema, seeds data, creates admin):

   ```bash
   npm run setup -- --email=owner@shop.com --password=changeme
   ```

   Flags: `--product-mode=full|minimal`, `--seed-users=true|false`, `--seed-synthetic=true|false`, `--name="Owner Name"`

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Visit `http://localhost:3000` and sign in with the admin you created.

**What's next:** [Add optional integrations](#optional-integrations) or read the [production notes](#production-notes).

---

## Optional Integrations

Add these env vars to `.env.local` (or your Vercel/Docker env) to unlock more features. The app works without them — features degrade gracefully.

| Integration | Env Vars | What it enables |
|-------------|----------|----------------|
| **Payments** | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Checkout, subscriptions, refunds |
| **Email** | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Order confirmations, shipping updates, password resets |
| **AI** | Configure via **Settings > AI** in admin (or `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`) | Chat assistant, product recommendations, content generation |
| **OAuth** | `AUTH_GOOGLE_ID/SECRET`, `AUTH_GITHUB_ID/SECRET` | Social login (Google, GitHub) |
| **Image Storage** | `BLOB_READ_WRITE_TOKEN` | Persistent image uploads via Vercel Blob ([setup guide](#image-storage)) |
| **Stripe Webhooks** | `STRIPE_WEBHOOK_SECRET` | Real-time order/subscription updates |

For local Stripe webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Production Notes

- **Migrations:** Run `npx prisma migrate deploy` on deploy.
- **Backups:** `npm run db:backup` writes JSON under `dev-tools/backups/`.
- **DB adapter:** Neon vs standard Postgres is auto-detected. Force with `DATABASE_ADAPTER=postgres|neon|standard`.
- **Docker smoke test:** See `docs/docker-smoke-test.md` for health check and persistence verification.

### Image Storage

Admin-uploaded images (product photos, page heroes, category icons) are stored in **Vercel Blob** by default.

**Setup (Vercel):**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → your project → **Storage** tab
2. Click **Create Database** → **Blob** → name it (e.g., `artisan-roast-images`) → **Public** access
3. Click **Create** — Vercel auto-injects `BLOB_READ_WRITE_TOKEN` into production/preview
4. For local dev: copy the token from Blob store → **Manage** → **Tokens** into `.env.local`

**Custom provider (S3, Cloudinary, etc.):** Replace `lib/blob.ts` — it exports `uploadToBlob()`, `deleteFromBlob()`, and `isBlobUrl()`. Add your storage hostname to `remotePatterns` in `next.config.ts`.

### Switching Between Neon and Local Postgres

- **Neon:** Keep `.env.local` `DATABASE_URL` pointing to Neon. Run `npm run dev`.
- **Local Docker:** `export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/artisan_roast?schema=public"` then `npm run dev`.
- **Switch back:** `unset DATABASE_URL` (so `.env.local` wins).

---

## Telemetry

Artisan Roast collects **anonymous usage data** (instance UUID, app version, aggregate counts). No personal information is ever collected.

| Event | Trigger |
|-------|---------|
| `install` | First database seed |
| `heartbeat` | Daily cron |

**Opt out** (any one of these):

1. `TELEMETRY_DISABLED=true` in env
2. Set `telemetry_enabled` to `"false"` in `siteSettings` table
3. Admin > Support > Data Privacy toggle

Override endpoint: `TELEMETRY_ENDPOINT="https://your-server.com/api/telemetry/events"`

---

## Google Analytics (Optional)

Disabled by default. Add to `.env.local`:

```env
NEXT_PUBLIC_GA4_ID="G-XXXXXXXXXX"
```

This tracks your storefront visitors using your own GA4 property — separate from platform telemetry.

---

## Troubleshooting

- **`DATABASE_URL is required`** — Confirm `.env.local` is loaded and the URL is reachable.
- **SSL errors** — Append `?sslmode=require` for managed Postgres providers.
- **Prisma errors after schema change** — `npx prisma generate` then rerun setup.
- **Stripe webhooks** — Ensure Stripe CLI is running; refresh `STRIPE_WEBHOOK_SECRET` on restart.
- **Empty store after deploy** — Set `SEED_ON_BUILD=true` or run `npm run seed` manually.
