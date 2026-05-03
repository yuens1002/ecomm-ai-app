import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { requireAdminApi } from "@/lib/admin";
import { resetStripeClient } from "@/lib/services/stripe";
import {
  loadStripeCredentials,
  saveStripeCredentials,
  clearStripeCredentials,
  getStripeConfigStatus,
} from "@/lib/payments/credentials";

function maskApiKey(key: string): string {
  if (!key || key.length <= 4) return key ? "••••" : "";
  return "••••••••" + key.slice(-4);
}

function detectMode(key: string): "test" | "live" | null {
  if (/^(sk|pk|rk)_test_/.test(key)) return "test";
  if (/^(sk|pk|rk)_live_/.test(key)) return "live";
  return null;
}

function checkModeMismatch(
  secretKey: string,
  publishableKey: string
): string | null {
  const secretMode = detectMode(secretKey);
  const pubMode = detectMode(publishableKey);
  if (secretMode && pubMode && secretMode !== pubMode) {
    return `Test/live mode mismatch — secret key is ${secretMode}, publishable key is ${pubMode}. Both must be from the same Stripe mode.`;
  }
  return null;
}

const StripeUpdateSchema = z.object({
  secretKey: z.string().optional(),
  publishableKey: z.string().optional(),
  webhookSecret: z.string().optional(),
});

async function validateWithStripe(secretKey: string): Promise<{
  ok: boolean;
  accountId?: string;
  accountName?: string;
  country?: string;
  currency?: string;
  error?: string;
}> {
  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
    const account = await stripe.accounts.retrieve();
    return {
      ok: true,
      accountId: account.id,
      accountName:
        (account as unknown as { settings?: { dashboard?: { display_name?: string } } })
          .settings?.dashboard?.display_name ?? account.id,
      country: account.country ?? undefined,
      currency: account.default_currency ?? undefined,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe validation failed";
    return { ok: false, error: message };
  }
}

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const envSecretSet = !!process.env.STRIPE_SECRET_KEY;
    const envWebhookSet = !!process.env.STRIPE_WEBHOOK_SECRET;
    const envPublishableSet = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    const dbStatus = await getStripeConfigStatus();

    let storedSecretMasked: string | null = null;
    let storedWebhookMasked: string | null = null;

    if (dbStatus.hasRow && !dbStatus.decryptionError) {
      const creds = await loadStripeCredentials();
      if (creds?.secretKey) storedSecretMasked = maskApiKey(creds.secretKey);
      if (creds?.webhookSecret)
        storedWebhookMasked = maskApiKey(creds.webhookSecret);
    }

    return NextResponse.json({
      envSecretSet,
      envWebhookSet,
      envPublishableSet,
      db: {
        hasRow: dbStatus.hasRow,
        hasSecretKey: dbStatus.hasSecretKey,
        hasWebhookSecret: dbStatus.hasWebhookSecret,
        publishableKey: dbStatus.publishableKey,
        accountId: dbStatus.accountId,
        accountName: dbStatus.accountName,
        isTestMode: dbStatus.isTestMode,
        lastValidatedAt: dbStatus.lastValidatedAt,
        decryptionError: dbStatus.decryptionError,
        secretKeyMasked: storedSecretMasked,
        webhookSecretMasked: storedWebhookMasked,
      },
    });
  } catch (error) {
    console.error("Error fetching Stripe settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch Stripe settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const parsed = StripeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let { secretKey, webhookSecret } = parsed.data;
    const { publishableKey } = parsed.data;

    // Don't overwrite stored values with masked placeholders
    if (secretKey?.startsWith("••")) secretKey = undefined;
    if (webhookSecret?.startsWith("••")) webhookSecret = undefined;

    if (publishableKey && secretKey) {
      const mismatch = checkModeMismatch(secretKey, publishableKey);
      if (mismatch) {
        return NextResponse.json({ error: mismatch }, { status: 400 });
      }
    }

    let accountMeta: {
      accountId?: string;
      accountName?: string;
      isTestMode?: boolean;
    } = {};

    if (secretKey) {
      const validation = await validateWithStripe(secretKey);
      if (!validation.ok) {
        return NextResponse.json(
          { error: "Invalid API key(s) entered, try again." },
          { status: 400 }
        );
      }
      accountMeta = {
        accountId: validation.accountId,
        accountName: validation.accountName,
        isTestMode: detectMode(secretKey) === "test",
      };
    }

    await saveStripeCredentials({
      ...(secretKey !== undefined && { secretKey }),
      ...(publishableKey !== undefined && { publishableKey }),
      ...(webhookSecret !== undefined && { webhookSecret }),
      ...accountMeta,
    });

    resetStripeClient();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving Stripe credentials:", error);
    return NextResponse.json(
      { error: "Failed to save Stripe credentials" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const auth = await requireAdminApi();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await clearStripeCredentials();
    resetStripeClient();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing Stripe credentials:", error);
    return NextResponse.json(
      { error: "Failed to clear Stripe credentials" },
      { status: 500 }
    );
  }
}
