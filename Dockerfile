# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS deps
ENV NODE_ENV=development
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
# Copy manifests and prisma schema early so prisma generate can run during install
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
ENV DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
RUN npm ci --include=dev

FROM node:24-bookworm-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy node_modules and source with correct ownership — avoids slow recursive chown pass
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

# Ensure /app is owned by node so runtime can create subdirs
RUN chown node:node /app

# Pre-build Next.js at image build time so container startup is fast (~10s vs ~5min)
# Dummy env vars satisfy validation — DB is not contacted during build (no-migrate + SKIP_SSG)
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV DIRECT_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV AUTH_SECRET="build-time-placeholder"
ENV SKIP_SSG=true
RUN npm run build:no-migrate

EXPOSE 3000

# Healthcheck hits /api/health — returns { status: "ok" } when app and DB are ready
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)process.exit(1);return r.json();}).then(b=>{if(b && b.status && b.status!=='ok')process.exit(1);}).catch(()=>process.exit(1))"

USER node
CMD ["npm", "run", "start"]
