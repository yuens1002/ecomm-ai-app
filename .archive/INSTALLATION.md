# Installation (Self-Hosted)

This guide walks a technical shop owner or developer through installing Artisan Roast on a standard PostgreSQL instance (no Neon required).

## Prerequisites

- Node.js 18+ and npm
- Git
- PostgreSQL 15 or 16 (network-accessible), with a database and user created
- Stripe account (test mode is fine) and Stripe CLI for local webhooks (optional)
- OAuth apps for Google/GitHub (or skip if using email/password only)

## 1) Clone and install

```bash
git clone https://github.com/yuens1002/ecomm-ai-app.git artisan-roast
cd artisan-roast
npm install
cp .env.example .env.local
```

## 2) Configure environment

Edit `.env.local`:

- `DATABASE_URL` — Postgres connection string (use pooled/pgBouncer if available)
- `DIRECT_URL` — Direct Postgres URL for migrations (optional but recommended)
- `AUTH_SECRET` — `openssl rand -base64 32`
- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (from `stripe listen` during dev)
- OAuth (optional): `AUTH_GOOGLE_ID/SECRET`, `AUTH_GITHUB_ID/SECRET`
- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- AI: `GEMINI_API_KEY`

## 3) Run one-command setup

Creates schema, seeds data, and provisions the first admin. Safe to rerun.

```bash
npm run setup -- --email=owner@shop.com --password=changeme \
  --product-mode=minimal --seed-users=false --seed-synthetic=false
```

Flags:

- `--product-mode=full|minimal` (default minimal seeds 1 coffee + 1 merch)
- `--seed-users=true|false` (default false; you’ll create the owner admin above)
- `--seed-synthetic=true|false` (default false; skip demo analytics/orders)
- `--name=Owner Name` (optional)

## 4) Start the app

```bash
npm run dev
# In another terminal (optional for payments):
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Visit ```http://localhost:3000``` and sign in with the admin you created.

## 5) Production notes

- Migrations: run `npx prisma migrate deploy` on deploy.
- Backups: `npm run db:backup` writes JSON under `dev-tools/backups/`.
- Adapter auto-detect: Neon vs Postgres is automatic; `DATABASE_ADAPTER=postgres|neon|standard` can force behavior.
- Images: add hosts in `next.config.ts` if serving media from your CDN/S3.
- Docker/compose smoke: see `docs/docker-smoke-test.md` for expected build logs, health check (`/api/health`), and persistence checks after `docker compose up --build -d`.

### Switching between Neon and local Postgres

There are two methods to switch databases. **Method 1 is recommended** for daily development.

#### Method 1: Edit `.env.local` (Recommended)

Simply edit `.env.local` to comment/uncomment the desired database:

**For Local PostgreSQL:**
```env
DATABASE_ADAPTER="standard"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/artisan_roast?schema=public"
# DATABASE_URL="postgresql://...@neon.tech/neondb?sslmode=require..."
```

**For Neon:**
```env
# DATABASE_ADAPTER="standard"
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/artisan_roast?schema=public"
DATABASE_URL="postgresql://...@neon.tech/neondb?sslmode=require..."
```

Then restart `npm run dev`. The adapter auto-detects Neon from the URL when `DATABASE_ADAPTER` is not set.

> **Important:** This method only works if you have NOT exported `DATABASE_URL` or `DATABASE_ADAPTER` in your shell. Shell exports override `.env.local`. If switching doesn't work, run `unset DATABASE_URL DATABASE_ADAPTER` first.

#### Method 2: Shell exports (for one-off sessions)

Use this for temporary switches without modifying files. **Shell exports override `.env.local`.**

```bash
# Switch to local
export DATABASE_ADAPTER=postgres
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/artisan_roast?schema=public"
npm run dev

# Switch back to Neon (clears exports, .env.local takes over)
unset DATABASE_URL
unset DATABASE_ADAPTER
npm run dev
```

PowerShell equivalent:
```pwsh
# Switch to local
$env:DATABASE_ADAPTER = "postgres"
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/artisan_roast?schema=public"
npm run dev

# Switch back to Neon
Remove-Item Env:DATABASE_ADAPTER
Remove-Item Env:DATABASE_URL
npm run dev
```

#### Initial setup for local DB (`artisan_roast`)

First time only - create and seed the local database:

```bash
export DATABASE_ADAPTER=postgres
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/artisan_roast?schema=public"
npm run setup -- --email=owner@example.com --password='Changeme123!' --name='Shop Owner' --product-mode=full --seed-users=true --seed-synthetic=true
# After setup, unset exports if you want to use Method 1 going forward:
unset DATABASE_URL DATABASE_ADAPTER
```

> Docker Compose uses `.env.docker` and ignores shell exports. Update `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, and `NEXTAUTH_URL=http://localhost:3000` there, then `docker compose restart app`. Seed via `docker compose exec app sh -c "SEED_PRODUCT_MODE=full SEED_INCLUDE_USERS=true SEED_INCLUDE_SYNTHETIC=true npm run seed"`.

## Troubleshooting

- `DATABASE_URL is required`: confirm `.env.local` is loaded and the URL is reachable.
- SSL errors: append `?sslmode=require` for managed Postgres providers.
- Prisma errors after schema change: `npx prisma generate` then rerun setup.
- Stripe webhooks: ensure Stripe CLI is running; refresh `STRIPE_WEBHOOK_SECRET` when restarting `stripe listen`.
