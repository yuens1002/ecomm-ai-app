import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "./encryption";

export interface StripeCredentials {
  secretKey: string;
  publishableKey: string | null;
  webhookSecret: string | null;
  accountId: string | null;
  accountName: string | null;
  isTestMode: boolean | null;
  lastValidatedAt: Date | null;
}

export async function loadStripeCredentials(): Promise<StripeCredentials | null> {
  const row = await prisma.paymentProcessorConfig.findUnique({
    where: { processor: "stripe" },
  });

  if (!row || !row.secretKey) return null;

  let secretKey: string;
  try {
    secretKey = decrypt(row.secretKey);
  } catch (err) {
    console.error(
      "[payments] Failed to decrypt Stripe secretKey — credentials encrypted with a different key:",
      err
    );
    return null;
  }

  let webhookSecret: string | null = null;
  if (row.webhookSecret) {
    try {
      webhookSecret = decrypt(row.webhookSecret);
    } catch (err) {
      console.error(
        "[payments] Failed to decrypt Stripe webhookSecret:",
        err
      );
    }
  }

  return {
    secretKey,
    publishableKey: row.publishableKey,
    webhookSecret,
    accountId: row.accountId,
    accountName: row.accountName,
    isTestMode: row.isTestMode,
    lastValidatedAt: row.lastValidatedAt,
  };
}

export interface SaveStripeCredentialsInput {
  secretKey?: string;
  publishableKey?: string;
  webhookSecret?: string;
  accountId?: string;
  accountName?: string;
  isTestMode?: boolean;
}

export async function saveStripeCredentials(
  input: SaveStripeCredentialsInput
): Promise<void> {
  const data: Record<string, unknown> = {
    updatedAt: new Date(),
    lastValidatedAt: new Date(),
  };

  if (input.secretKey !== undefined) {
    data.secretKey = encrypt(input.secretKey);
  }
  if (input.webhookSecret !== undefined) {
    data.webhookSecret = encrypt(input.webhookSecret);
  }
  if (input.publishableKey !== undefined) {
    data.publishableKey = input.publishableKey;
  }
  if (input.accountId !== undefined) {
    data.accountId = input.accountId;
  }
  if (input.accountName !== undefined) {
    data.accountName = input.accountName;
  }
  if (input.isTestMode !== undefined) {
    data.isTestMode = input.isTestMode;
  }

  await prisma.paymentProcessorConfig.upsert({
    where: { processor: "stripe" },
    create: { processor: "stripe", isActive: true, ...data },
    update: data,
  });
}

export async function clearStripeCredentials(): Promise<void> {
  await prisma.paymentProcessorConfig.deleteMany({
    where: { processor: "stripe" },
  });
}

export async function getStripeConfigStatus(): Promise<{
  hasRow: boolean;
  accountId: string | null;
  accountName: string | null;
  isTestMode: boolean | null;
  lastValidatedAt: Date | null;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  publishableKey: string | null;
  decryptionError: boolean;
}> {
  const row = await prisma.paymentProcessorConfig.findUnique({
    where: { processor: "stripe" },
  });

  if (!row) {
    return {
      hasRow: false,
      accountId: null,
      accountName: null,
      isTestMode: null,
      lastValidatedAt: null,
      hasSecretKey: false,
      hasWebhookSecret: false,
      publishableKey: null,
      decryptionError: false,
    };
  }

  let decryptionError = false;
  if (row.secretKey) {
    try {
      decrypt(row.secretKey);
    } catch {
      decryptionError = true;
    }
  }

  return {
    hasRow: true,
    accountId: row.accountId,
    accountName: row.accountName,
    isTestMode: row.isTestMode,
    lastValidatedAt: row.lastValidatedAt,
    hasSecretKey: !!row.secretKey,
    hasWebhookSecret: !!row.webhookSecret,
    publishableKey: row.publishableKey,
    decryptionError,
  };
}
