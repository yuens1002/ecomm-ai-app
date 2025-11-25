import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import NewsletterWelcomeEmail from "@/emails/NewsletterWelcomeEmail";
import { z } from "zod";
import crypto from "crypto";

const newsletterSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * POST /api/newsletter
 * Subscribe to newsletter
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = newsletterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { message: "You're already subscribed to our newsletter!" },
          { status: 200 }
        );
      } else {
        // Reactivate subscription
        const subscriber = await prisma.newsletterSubscriber.update({
          where: { email },
          data: { isActive: true, subscribedAt: new Date() },
        });

        // Send welcome back email
        try {
          const emailSetting = await prisma.siteSettings.findUnique({
            where: { key: "contactEmail" },
          });
          const fromEmail = emailSetting?.value || "onboarding@resend.dev";

          await resend.emails.send({
            from: `Artisan Roast <${fromEmail}>`,
            to: [email],
            subject: "Welcome Back to Artisan Roast Newsletter! ☕",
            react: NewsletterWelcomeEmail({
              email,
              unsubscribeToken: subscriber.unsubscribeToken,
            }),
          });
        } catch (emailError) {
          console.error("Error sending welcome back email:", emailError);
        }

        return NextResponse.json(
          { message: "Welcome back! Your subscription has been reactivated." },
          { status: 200 }
        );
      }
    }

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomBytes(32).toString("hex");

    // Create new subscription
    const subscriber = await prisma.newsletterSubscriber.create({
      data: { 
        email,
        unsubscribeToken,
      },
    });

    // Get contact email from settings
    const emailSetting = await prisma.siteSettings.findUnique({
      where: { key: "contactEmail" },
    });
    const fromEmail = emailSetting?.value || "onboarding@resend.dev";

    // Send welcome email
    try {
      await resend.emails.send({
        from: `Artisan Roast <${fromEmail}>`,
        to: [email],
        subject: "Welcome to Artisan Roast Newsletter! ☕",
        react: NewsletterWelcomeEmail({
          email,
          unsubscribeToken: subscriber.unsubscribeToken,
        }),
      });
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail the subscription if email fails
    }

    return NextResponse.json(
      { message: "Successfully subscribed to our newsletter!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again later." },
      { status: 500 }
    );
  }
}
