import { resend } from "@/lib/services/resend";
import { prisma } from "@/lib/prisma";

interface NewReviewNotificationData {
  productName: string;
  reviewerName: string;
  rating: number;
  isPending: boolean;
}

export async function sendNewReviewNotification(
  data: NewReviewNotificationData
): Promise<void> {
  // Find all admin emails
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { email: true },
  });

  const adminEmails = admins
    .map((a) => a.email)
    .filter((e): e is string => !!e);

  if (adminEmails.length === 0) return;

  const stars = "\u2605".repeat(data.rating) + "\u2606".repeat(5 - data.rating);
  const statusNote = data.isPending
    ? "\n\nThis review was auto-flagged and is awaiting moderation."
    : "";

  await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ??
      "Artisan Roast <noreply@artisanroast.app>",
    to: adminEmails,
    subject: `New review: ${data.productName} (${data.rating}/5)`,
    text: `A new review was submitted for ${data.productName}.\n\nReviewer: ${data.reviewerName}\nRating: ${stars}${statusNote}\n\nView in admin: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://artisanroast.app"}/admin/reviews`,
  });
}
