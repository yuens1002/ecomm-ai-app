# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS deps
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

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy node_modules and source; build will run at container start (via compose command) once DB is reachable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chown -R node:node /app

EXPOSE 3000

# Healthcheck expects /api/health (will be added in Phase 2)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)process.exit(1);return r.json();}).then(b=>{if(b && b.status && b.status!=='ok')process.exit(1);}).catch(()=>process.exit(1))"

USER node
CMD ["npm", "run", "start"]
