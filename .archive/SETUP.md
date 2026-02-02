# Setup Guide - Artisan Roast

Complete setup instructions for running Artisan Roast locally and deploying to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Database Setup (Neon PostgreSQL)](#database-setup-neon-postgresql)
- [Stripe Setup](#stripe-setup)
- [OAuth Setup](#oauth-setup)
- [Running the Application](#running-the-application)
- [Deployment (Vercel)](#deployment-vercel)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v22 LTS or higher) - [Download](https://nodejs.org/)
- **npm** (v10 or higher, comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **Stripe CLI** (for local webhook testing) - [Installation Guide](https://stripe.com/docs/stripe-cli)

You'll also need accounts for:

- [Neon](https://neon.tech/) (PostgreSQL database)
- [Stripe](https://stripe.com/) (payment processing)
- [Google Cloud Console](https://console.cloud.google.com/) (OAuth)
- [GitHub](https://github.com/) (OAuth & code hosting)

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yuens1002/ecomm-ai-app.git
cd artisan-roast
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Now let's fill in each section...

---

## Database Setup (Neon PostgreSQL)

### 1. Create a Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Click **"New Project"**
3. Name your project (e.g., "artisan-roast-dev")
4. Select a region close to you
5. Click **"Create Project"**

### 2. Get Connection Strings

Neon provides two types of connection strings:

**Pooled Connection** (for app runtime):

```
postgresql://user:password@host-pooler.region.neon.tech/dbname?sslmode=require
```

**Direct Connection** (for migrations - remove `-pooler` from hostname):

```
postgresql://user:password@host.region.neon.tech/dbname?sslmode=require
```

### 3. Add to `.env.local`

```env
DATABASE_URL="postgresql://user:password@host-pooler.region.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host.region.neon.tech/dbname?sslmode=require"
```

### 4. Run Migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

### 5. Seed the Database (Optional)

```bash
npm run seed
```

This will populate your database with sample coffee products.

---

## Stripe Setup

### 1. Create a Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Sign up for a free account
3. Switch to **Test Mode** (toggle in top-right)

### 2. Get API Keys

1. Go to **Developers → API Keys**
2. Copy the following:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 3. Add to `.env.local`

```env
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 4. Set Up Local Webhooks

For local development, you need the Stripe CLI to forward webhook events:

#### Install Stripe CLI

**macOS (Homebrew):**

```bash
brew install stripe/stripe-cli/stripe
```

**Windows (Scoop):**

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**

```bash
# Download the latest release from GitHub
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

#### Login and Start Webhook Listener

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret (starts with `whsec_`). Add it to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Important:** Keep this terminal running while developing! Webhooks won't work without it.

---

## OAuth Setup

### Google OAuth

#### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services → Credentials**
4. Click **"Create Credentials" → "OAuth client ID"**
5. Application type: **Web application**
6. Name: `Artisan Roast (Local)`

#### 2. Configure URLs

**Authorized JavaScript origins:**

```
http://localhost:3000
```

**Authorized redirect URIs:**

```
http://localhost:3000/api/auth/callback/google
```

#### 3. Add to `.env.local`

```env
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-your-client-secret"
```

---

### GitHub OAuth

#### 1. Register OAuth App

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name:** `Artisan Roast (Local)`
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
4. Click **"Register application"**

#### 2. Get Client ID and Secret

1. Copy the **Client ID**
2. Click **"Generate a new client secret"**
3. Copy the secret immediately (you won't see it again!)

#### 3. Add to `.env.local`

```env
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"
```

---

### Auth Secret

Generate a random secret for Auth.js:

```bash
openssl rand -base64 32
```

Add to `.env.local`:

```env
AUTH_SECRET="your-random-32-byte-string"
```

---

## Running the Application

### 1. Start the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### 2. Start Stripe Webhook Listener (separate terminal)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 3. Test the Application

- **Browse products:** Navigate to homepage
- **Add to cart:** Click on any product, select options, add to cart
- **Checkout:** Click cart icon, proceed to checkout
- **Test payment:** Use Stripe test card: `4242 4242 4242 4242`
- **Sign in:** Try OAuth with GitHub or Google
- **View orders:** After successful checkout, go to Orders page

---

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/)
2. Click **"Add New → Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### 3. Add Environment Variables

Go to **Project Settings → Environment Variables** and add ALL variables from `.env.local`:

**Database:**

- `DATABASE_URL` (use pooled connection)
- `DIRECT_URL` (use direct connection - remove `-pooler`)

**Stripe:**

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (temporary - see production webhooks below)

**Auth:**

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID` (temporary - need production OAuth)
- `AUTH_GOOGLE_SECRET` (temporary)
- `AUTH_GITHUB_ID` (temporary)
- `AUTH_GITHUB_SECRET` (temporary)

**AI:**

- `GEMINI_API_KEY`

### 4. Set Up Production OAuth (After First Deploy)

Your app will be deployed at `https://your-app.vercel.app`. Now create production OAuth apps:

#### Google OAuth (Production)

1. Go back to Google Cloud Console → Credentials
2. Create new OAuth client ID for production
3. **Authorized JavaScript origins:**

   ```
   https://your-app.vercel.app
   ```

4. **Authorized redirect URIs:**

   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

5. Update `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in Vercel **Production** environment

#### GitHub OAuth (Production)

1. Create new OAuth App in GitHub
2. **Homepage URL:** `https://your-app.vercel.app`
3. **Authorization callback URL:** `https://your-app.vercel.app/api/auth/callback/github`
4. Update `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` in Vercel **Production** environment

### 5. Set Up Production Stripe Webhooks

1. Go to Stripe Dashboard → **Developers → Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://your-app.vercel.app/api/webhooks/stripe`
4. **Events to send:**
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Update `STRIPE_WEBHOOK_SECRET` in Vercel **Production** environment

### 6. Apply Database Migrations (One-Time)

**Important:** Migrations are NOT automatically applied during Vercel builds to avoid connection timeouts. You need to run them manually once after initial deployment.

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Run migration in production environment
vercel env pull .env.production  # Download production env vars
npx prisma migrate deploy
```

**Option B: Using a temporary build command**

1. Temporarily change the build command in Vercel to: `prisma generate && prisma migrate deploy && next build`
2. Trigger a deployment
3. Once successful, change it back to: `prisma generate && next build`

**When to run migrations:**

- After initial deployment
- After making schema changes (new migrations created)
- Never needed for regular code deployments

### 7. Redeploy

After updating environment variables or applying migrations, trigger a new deployment from Vercel dashboard or push a new commit.

---

## Troubleshooting

### Database Connection Errors

**Error:** `P1002: The database server was reached but timed out`

**Solution:** Make sure you're using `DIRECT_URL` for migrations (without `-pooler` in hostname)

### Stripe Webhook Not Working Locally

**Problem:** Orders not saving after checkout

**Solution:**

1. Verify Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Check `STRIPE_WEBHOOK_SECRET` matches the CLI output
3. Restart dev server after updating `.env.local`

### OAuth Errors

**Error:** `redirect_uri_mismatch`

**Solution:** Verify callback URLs exactly match:

- **Local:** `http://localhost:3000/api/auth/callback/{provider}`
- **Production:** `https://your-domain.vercel.app/api/auth/callback/{provider}`

### Prisma Generate Fails on Windows

**Error:** `EPERM: operation not permitted`

**Solution:** Stop the dev server, then run:

```bash
npx prisma generate
npm run dev
```

### Database Migrations on Vercel

**Problem:** Build fails with database connection timeout

**Why:** Neon's direct connection can be slow during cold starts. Migrations are removed from the build script to prevent timeouts.

**Solution:** Migrations should be run manually (see deployment step 6). Regular builds only need `prisma generate` which doesn't require a database connection.

---

## Need Help?

- **Issues:** [GitHub Issues](https://github.com/yuens1002/ecomm-ai-app/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yuens1002/ecomm-ai-app/discussions)

---

## Next Steps

Once everything is running:

- [ ] Customize product data in `prisma/seed.ts`
- [ ] Update branding/colors in `tailwind.config.ts`
- [ ] Add more product categories
- [ ] Implement email notifications
- [ ] Add inventory management
- [ ] Create admin dashboard

Happy coding! ☕
