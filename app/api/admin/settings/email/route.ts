import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import {
  getEmailProviderSettings,
  setEmailProviderSettings,
} from "@/lib/config/app-settings";
import { getResend } from "@/lib/services/resend";

/**
 * GET /api/admin/settings/email
 * Fetch email settings
 */
export async function GET() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const [contactEmailSetting, notifyAdminSetting, provider] =
      await Promise.all([
        prisma.siteSettings.findUnique({
          where: { key: "contactEmail" },
          select: { value: true },
        }),
        prisma.siteSettings.findUnique({
          where: { key: "notifyAdminOnNewsletterSignup" },
          select: { value: true },
        }),
        getEmailProviderSettings(),
      ]);

    const rawKey = provider.apiKey;
    const maskedKey = rawKey.length > 4
      ? `••••${rawKey.slice(-4)}`
      : rawKey
        ? "••••"
        : "";

    return NextResponse.json({
      contactEmail: contactEmailSetting?.value || "onboarding@resend.dev",
      notifyAdminOnNewsletterSignup:
        notifyAdminSetting?.value === "true" || false,
      apiKey: maskedKey,
      fromEmail: provider.fromEmail,
      fromName: provider.fromName,
    });
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/email
 * Update email settings
 */
export async function PUT(request: NextRequest) {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { contactEmail, notifyAdminOnNewsletterSignup, apiKey, fromEmail, fromName } =
      body as Record<string, unknown>;

    if (
      contactEmail !== undefined &&
      !z.string().email().safeParse(contactEmail).success
    ) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (
      fromEmail !== undefined &&
      fromEmail !== "" &&
      !z.string().email().safeParse(fromEmail).success
    ) {
      return NextResponse.json(
        { error: "Invalid from email format" },
        { status: 400 }
      );
    }

    const ops: Promise<unknown>[] = [];

    if (contactEmail !== undefined) {
      ops.push(
        prisma.siteSettings.upsert({
          where: { key: "contactEmail" },
          update: { value: String(contactEmail) },
          create: { key: "contactEmail", value: String(contactEmail) },
        })
      );
    }

    if (notifyAdminOnNewsletterSignup !== undefined) {
      ops.push(
        prisma.siteSettings.upsert({
          where: { key: "notifyAdminOnNewsletterSignup" },
          update: { value: String(notifyAdminOnNewsletterSignup) },
          create: {
            key: "notifyAdminOnNewsletterSignup",
            value: String(notifyAdminOnNewsletterSignup),
          },
        })
      );
    }

    // Only update apiKey if it's a new value (not the masked placeholder returned by GET)
    const providerUpdate: Parameters<typeof setEmailProviderSettings>[0] = {};
    if (
      apiKey !== undefined &&
      apiKey !== "" &&
      !String(apiKey).startsWith("••••")
    ) {
      providerUpdate.apiKey = String(apiKey);
    }
    if (fromEmail !== undefined) providerUpdate.fromEmail = String(fromEmail);
    if (fromName !== undefined) providerUpdate.fromName = String(fromName);

    if (Object.keys(providerUpdate).length > 0) {
      ops.push(setEmailProviderSettings(providerUpdate));
    }

    await Promise.all(ops);

    return NextResponse.json({ message: "Email settings updated successfully" });
  } catch (error) {
    console.error("Error updating email settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/email
 * Send a test email using the current provider settings
 */
export async function POST() {
  const { authorized, error } = await requireAdminApi();
  if (!authorized) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const { apiKey, fromEmail, fromName } = await getEmailProviderSettings();
    const resend = getResend(apiKey || undefined);
    if (!resend) {
      return NextResponse.json(
        { error: "Email provider not configured — add a Resend API key first" },
        { status: 400 }
      );
    }

    const contactRow = await prisma.siteSettings.findUnique({
      where: { key: "contactEmail" },
    });
    const toEmail = contactRow?.value;
    if (!toEmail) {
      return NextResponse.json(
        { error: "No contact email configured to send test to" },
        { status: 400 }
      );
    }

    const from = fromEmail
      ? (fromName ? `${fromName} <${fromEmail}>` : fromEmail)
      : "noreply@example.com";

    await resend.emails.send({
      from,
      to: toEmail,
      subject: "Test email from your store",
      html: "<p>Your email configuration is working correctly.</p>",
    });

    return NextResponse.json({ message: `Test email sent to ${toEmail}` });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send test email",
      },
      { status: 500 }
    );
  }
}
