# Prisma 7 Upgrade with Neon Serverless Adapter

## Overview

This document details the specific configuration required to successfully upgrade to Prisma v7.0.0 while using the `@prisma/adapter-neon` in a standard Node.js environment (non-edge).

## The Challenge

Prisma 7 introduced significant changes to how adapters are initialized. Additionally, the `@neondatabase/serverless` driver, which is designed for edge environments (like Vercel Edge Functions or Cloudflare Workers), requires explicit WebSocket configuration when running in a standard Node.js runtime (like our build scripts or seed scripts).

Without this configuration, the build process fails with connection errors because the serverless driver cannot find a suitable WebSocket implementation in the Node.js global scope.

## The Solution

To make Prisma 7 work seamlessly with Neon in our Next.js application (both for runtime and build time), we implemented the following configuration pattern in `lib/prisma.ts` and our seed scripts.

### 1. Explicit WebSocket Configuration

We import `ws` and explicitly assign it to the `neonConfig`. This bridges the gap between the serverless driver and the Node.js environment.

```typescript

import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configure neon to use ws for WebSocket connections
// Required for non-edge environments like Node.js build/seed scripts
neonConfig.webSocketConstructor = ws;
```

### 2. Adapter Initialization (Prisma 7 Style)

In Prisma 7, the `PrismaNeon` adapter acts as a factory and takes a configuration object directly, rather than a `Pool` instance.

**Old (Prisma 5/6):**

```typescript

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
```

**New (Prisma 7):**

```typescript

const adapter = new PrismaNeon({ connectionString });
```

### 3. Complete Implementation

Here is the robust singleton pattern used in `lib/prisma.ts`:

```typescript

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// 1. Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL!;

  // 2. Initialize adapter with config object
  const adapter = new PrismaNeon({ connectionString });

  // 3. Pass adapter to PrismaClient
  return new PrismaClient({
    adapter,
  });
};

// Singleton pattern to prevent connection exhaustion in dev
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

## Benefits

- **Serverless-Ready**: Uses the HTTP/WebSocket-based driver optimized for Neon's serverless architecture.
- **Build Compatibility**: Works correctly during `next build` and `prisma seed` where a full Node.js environment is present.
- **Future Proof**: Aligned with Prisma 7's new adapter API.
