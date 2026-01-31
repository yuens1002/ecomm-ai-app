# Docker Stack Smoke Test

Use this checklist after building the Docker image/compose stack to confirm the container is healthy and the app boots with expected behaviors. Times assume a laptop; cloud runners may vary.

## Prerequisites

- `.env.docker` populated (copy from `.env.docker.example`).
- Docker daemon running.

## Bring up the stack

```bash

# rebuild and start
docker compose up --build -d

# check container health
docker ps --format '{{.Names}}\t{{.Status}}'
```

Expected: `artisan-roast-db-1` healthy; `artisan-roast-app-1` up.

## Logs to confirm normal behavior

```bash

docker compose logs app --tail=120
```

Normal indicators:

- `✔ Generated Prisma Client...`
- `Creating an optimized production build ...` then `Compiled successfully`
- `prisma migrate deploy` runs before `npm run start` (ensures tables exist)
- `Next.js ... Ready` with local URL.

## Health endpoint

```text

curl -s http://localhost:3000/api/health
```

- `status: "ok"` when DB + required envs are valid.
- `status: "degraded"` is expected if `STRIPE_SECRET_KEY` is a placeholder; Stripe check reports `Invalid API Key ...`.
- Resend check is `skipped` if API key is absent.

## Optional setup/seed

```bash

# create admin + seed minimal data
docker compose run --rm app npm run setup -- --email=owner@shop.com --password=changeme
```

If you run setup after first boot, restart app to reload static content:

```bash

docker compose restart app
```

## UI/API spot checks

- Load `http://localhost:3000` and browse products/pages.
- Sign in with the admin you created.
- Call a simple API: `curl -s http://localhost:3000/api/settings/public` (should return JSON).

## Persistence check

```bash

docker compose down
docker compose up -d
```

Expected: Data remains (Postgres volume `postgres_data` and uploads volume `product_uploads`).

## Troubleshooting norms

- Build-time DB errors: confirm `DATABASE_URL`/`DIRECT_URL` in `.env.docker` and that `db` is healthy; build runs `prisma migrate deploy` before Next.js build.
- Permission errors in `.prisma`: ensure image was rebuilt after 2025-12-09 changes (Dockerfile now `chown`s /app for the node user).
- Healthcheck failing only on Stripe: supply a real `STRIPE_SECRET_KEY` or accept `degraded` for local dev.

## Metrics to track over time

- Build duration (`docker compose up --build`): typically a few minutes on first run (longest step is `chown -R node:node /app`).
- App cold start after containers healthy: ~1s to `Ready` in logs.
- Health endpoint: expect `status: ok` when real keys are set; `degraded` if Stripe placeholder.
