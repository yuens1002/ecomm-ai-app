import { getResend } from "@/lib/services/resend";
import { render } from "@react-email/render";
import { getEmailBranding, getEmailProviderSettings } from "@/lib/config/app-settings";
import NewReviewNotification from "@/emails/NewReviewNotification";

interface NewReviewNotificationData {
  productName: string;
  reviewerName: string;
  rating: number;
  isPending: boolean;
}

export async function sendNewReviewNotification(
  data: NewReviewNotificationData
): Promise<void> {
  const { logoUrl } = await getEmailBranding();
  const { apiKey, fromEmail, fromName, contactEmail } = await getEmailProviderSettings();

  const merchantEmail =
    process.env.RESEND_MERCHANT_EMAIL ||
    process.env.MERCHANT_EMAIL ||
    contactEmail ||
    "";

  if (!merchantEmail) return;

  const html = await render(
    NewReviewNotification({
      productName: data.productName,
      reviewerName: data.reviewerName,
      rating: data.rating,
      isPending: data.isPending,
      logoUrl,
    })
  );

  const resend = getResend(apiKey || undefined);
  if (!resend) return;

  await resend.emails.send({
    from: fromEmail
      ? (fromName ? `${fromName} <${fromEmail}>` : fromEmail)
      : "noreply@example.com",
    to: merchantEmail,
    subject: `New review: ${data.productName} (${data.rating}/5)`,
    html,
  });
}
