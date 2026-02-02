# VAPI Voice Assistant - Local Development Setup

This guide explains how to set up and run the VAPI Voice Assistant locally. Due to the nature of voice AI webhooks, this feature requires a specific setup to expose your local server to the internet.

## Prerequisites

- **Node.js** (v18+)
- **Localtunnel** (installed via `npm install -D localtunnel`)
- **VAPI Account** (optional, if you want to manage assistants via dashboard, but we use ephemeral config)

## 1. The Challenge: Webhooks & Localhost

VAPI needs to send audio streams and function calls (like `addToCart`) to your backend. Since VAPI's servers cannot reach `localhost:3000`, we must use a tunneling service to expose a public URL.

We use **Localtunnel** because it allows us to request a persistent subdomain (unlike ngrok's free tier which randomizes it every time).

## 2. Start the Tunnel

In a separate terminal window, run:

```text

npx localtunnel --port 3000 --subdomain stupid-cases-joke
```

**Important:**

- The subdomain `stupid-cases-joke` is hardcoded in `lib/vapi-config.ts`.
- If you lose this subdomain (someone else takes it), you must:
  1. Pick a new subdomain in the command above.
  2. Update `server.url` in `lib/vapi-config.ts` to match.

## 3. Configuration (`lib/vapi-config.ts`)

The configuration file controls how the assistant behaves. Key settings:

```typescript

export const VAPI_ASSISTANT_CONFIG = {
  // ...
  server: {
    // MUST match your localtunnel URL
    url: "https://stupid-cases-joke.loca.lt/api/vapi/webhook",
    // ...
    headers: {
      // CRITICAL: Bypasses localtunnel's "Click to continue" warning page
      "bypass-tunnel-reminder": "true",
      // ...
    },
  },
  // ...
};
```

## 4. Running the App

1. **Start the Next.js server:**

   ```bash
   npm run dev

```

2. **Start the Tunnel (if not running):**

   ```bash
   npx localtunnel --port 3000 --subdomain stupid-cases-joke
```

1. **Access the App:**
   - Open `http://localhost:3000` (for your own browsing).
   - The Voice Assistant will internally use the `https://stupid-cases-joke.loca.lt` URL to communicate with VAPI.

## 5. Limitations & Troubleshooting

### "Error connecting to voice server"

- **Cause:** The tunnel might be down or the subdomain changed.
- **Fix:** Check the terminal running localtunnel. Ensure the URL matches `lib/vapi-config.ts`.

### "KrispSDK is duplicated"

- **Cause:** React Strict Mode causing double-initialization of the VAPI SDK.
- **Fix:** We implemented a Singleton pattern in `hooks/use-vapi.ts`. If you see this, refresh the page.

### Latency

- **Cause:** The audio goes from: User -> VAPI -> LocalTunnel -> Your PC -> OpenAI -> Your PC -> LocalTunnel -> VAPI -> User.
- **Note:** Expect 1-2 seconds of latency in local dev. Production (Vercel) will be faster.

### "Bypass Tunnel Reminder"

- **Context:** Localtunnel shows a warning page for non-whitelisted IPs.
- **Fix:** We send the `bypass-tunnel-reminder: true` header in `vapi-config.ts`. Do not remove this header, or the webhook will fail silently.

## 6. Deployment

When deploying to Vercel:

1. You do **not** need localtunnel.
2. Update `lib/vapi-config.ts` to use your production URL (e.g., `https://artisan-roast.vercel.app/api/vapi/webhook`).
3. Ideally, use an Environment Variable for the base URL:

   ```typescript
   url: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`;
   ```
