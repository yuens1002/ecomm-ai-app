# Self-Hosting Artisan Roast

## What to expect

Artisan Roast is a self-hosted e-commerce platform — you own the code, the data, and the deployment. There is no zero-friction one-click install. Setting it up requires a database, a deployment target, and about 30 minutes of configuration.

**You need to be comfortable with:**
- Creating a free cloud database account (Neon)
- Deploying a Next.js app to Vercel (or similar)
- Setting environment variables in a dashboard

**You do not need to:**
- Write any code
- Run anything locally (unless you want to)
- Manage servers or infrastructure

---

## Prerequisites

| What | Where | Cost |
|------|-------|------|
| PostgreSQL database | [Neon](https://neon.tech) | Free tier |
| Deployment host | [Vercel](https://vercel.com) | Free tier |
| GitHub account | [GitHub](https://github.com) | Free |
| Stripe account *(optional)* | [Stripe](https://stripe.com) | Free, pay per transaction |

---

## Step 1 — Fork the repository

1. Go to [github.com/yuens1002/artisan-roast](https://github.com/yuens1002/artisan-roast)
2. Click **Fork** → create a fork in your own GitHub account

---

## Step 2 — Create your database (Neon)

1. Sign up at [neon.tech](https://neon.tech) and create a new project
2. On the project dashboard, go to **Connection Details**
3. Select **Prisma** from the connection string dropdown
4. Copy both connection strings — you'll need them in the next step:
   - `DATABASE_URL` — pooled connection (used at runtime)
   - `DIRECT_URL` — direct connection (used for migrations)

---

## Step 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project** → import your forked repository
3. Vercel will detect it as a Next.js app automatically
4. Before deploying, open **Environment Variables** and add:

### Required

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon pooled connection string |
| `DIRECT_URL` | Your Neon direct connection string |
| `AUTH_SECRET` | Run `openssl rand -base64 32` to generate |
| `NEXTAUTH_SECRET` | Same value as `AUTH_SECRET` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. `https://my-store.vercel.app`) |

### Optional — add now or later

| Integration | Env Vars | What it enables |
|-------------|----------|----------------|
| **Payments** | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Checkout, subscriptions, refunds |
| **Email** | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_MERCHANT_EMAIL` | Order confirmations, shipping updates |
| **AI** | `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` *(or configure in admin Settings → AI)* | Chat assistant, product recommendations, content generation |
| **OAuth** | `AUTH_GOOGLE_ID/SECRET`, `AUTH_GITHUB_ID/SECRET` | Social login for customers |
| **Image Storage** | `BLOB_READ_WRITE_TOKEN` | Persistent product/page image uploads via Vercel Blob |
| **Analytics** | `NEXT_PUBLIC_GA4_ID` | Google Analytics 4 for your storefront |

5. Click **Deploy** — Vercel builds the app, runs migrations, and deploys. First deploy takes ~3 minutes.

---

## Step 4 — Create your admin account

1. Visit `https://your-store.vercel.app/setup`
2. Read and accept the terms
3. Enter your name, email, and a strong password
4. Click **Create Admin Account**
5. You'll be redirected to sign in — use the credentials you just created

---

## Step 5 — Configure your store

In the admin panel (`/admin`), complete the Getting Started checklist:

1. **Store settings** — name, logo, tagline
2. **Add products** — create your first product with images and pricing
3. **Set up Stripe** — connect payments (see below)
4. **Configure categories** — organise your menu

---

## Setting up Stripe

1. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to Vercel and redeploy
2. In the Stripe dashboard → **Developers → Webhooks**, add endpoint:
   `https://your-store.vercel.app/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `customer.subscription.*`
4. Copy the **Signing secret** → add as `STRIPE_WEBHOOK_SECRET` in Vercel → redeploy

For local Stripe webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Setting up image storage (Vercel Blob)

Admin-uploaded images (product photos, page heroes, category icons) require Vercel Blob:

1. Vercel dashboard → your project → **Storage** tab
2. **Create Database → Blob** → name it → **Public** access
3. Vercel auto-injects `BLOB_READ_WRITE_TOKEN` into production and preview environments
4. For local dev: copy the token from Blob store → **Manage → Tokens** into `.env.local`

**Custom provider (S3, Cloudinary, etc.):** Replace `lib/blob.ts` — it exports `uploadToBlob()`, `deleteFromBlob()`, and `isBlobUrl()`. Add your storage hostname to `remotePatterns` in `next.config.ts`.

---

## Updating your store

When a new version is released:

1. In your GitHub fork, click **Sync fork → Update branch**
2. Vercel redeploys automatically
3. Database migrations run on deploy — no manual steps needed

---

## Running locally (optional)

```bash
git clone https://github.com/YOUR_USERNAME/artisan-roast
cd artisan-roast
cp .env.example .env.local
# Add DATABASE_URL, DIRECT_URL, AUTH_SECRET to .env.local
npm install
npm run dev
```

Visit `http://localhost:3000/setup` to create your admin account.

---

## Production notes

- **Migrations** — run automatically on Vercel deploy via `npx prisma migrate deploy`
- **Backups** — `npm run db:backup` writes JSON under `dev-tools/backups/`
- **DB adapter** — Neon vs standard Postgres is auto-detected. Override with `DATABASE_ADAPTER=neon|postgres`

---

## Telemetry

Artisan Roast collects **anonymous usage data** (instance UUID, app version, aggregate counts). No personal information is ever collected.

**Opt out** via any of:
1. `TELEMETRY_DISABLED=true` in env
2. Admin → Support → Data Privacy toggle

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Deploy fails with database error | Check `DATABASE_URL` and `DIRECT_URL` are both set; use Prisma-format strings from Neon, not raw psql |
| `/setup` shows "Setup Already Complete" | An admin exists — go to `/auth/signin` |
| Checkout buttons disabled | Add `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to Vercel and redeploy |
| Images not showing after upload | Add `BLOB_READ_WRITE_TOKEN` — see image storage setup above |
| SSL errors | Append `?sslmode=require` to your connection string |
| Empty store after deploy | Set `SEED_ON_BUILD=true` or run `npm run seed` manually |

---

## Where to get help

- **GitHub Issues**: [github.com/yuens1002/artisan-roast/issues](https://github.com/yuens1002/artisan-roast/issues)
- **Live demo**: [demo.artisanroast.app](https://demo.artisanroast.app)
