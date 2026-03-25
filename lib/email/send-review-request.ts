import { getResend } from "@/lib/services/resend";
import { render } from "@react-email/render";
import { getEmailBranding, getEmailProviderSettings } from "@/lib/config/app-settings";
import ReviewRequestEmail from "@/emails/ReviewRequestEmail";

interface ReviewRequestEmailData {
  customerEmail: string;
  customerName: string;
  products: Array<{ name: string; slug: string; imageUrl: string | null }>;
  storeName?: string;
}

export async function sendReviewRequest(
  data: ReviewRequestEmailData
): Promise<void> {
  const { logoUrl } = await getEmailBranding();
  const { apiKey, fromEmail, fromName } = await getEmailProviderSettings();

  const html = await render(
    ReviewRequestEmail({
      customerName: data.customerName,
      products: data.products,
      storeName: data.storeName,
      logoUrl,
    })
  );

  const resend = getResend(apiKey || undefined);
  if (!resend) return;

  await resend.emails.send({
    from: fromName ? `${fromName} <${fromEmail}>` : fromEmail || "noreply@example.com",
    to: data.customerEmail,
    subject: "How was your coffee? Share a Brew Report!",
    html,
  });
}
