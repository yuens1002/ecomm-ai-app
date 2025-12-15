import { requireAdmin } from "@/lib/admin";
import NewsletterManagementClient from "./NewsletterManagementClient";
import { PageTitle } from "@/components/admin/PageTitle";

export const metadata = {
  title: "Newsletter Subscribers | Admin",
  description: "Manage newsletter subscribers",
};

export default async function NewsletterPage() {
  await requireAdmin();

  return (
    <>
      <PageTitle
        title="Newsletter Subscribers"
        subtitle="Manage newsletter subscribers and campaigns"
      />
      <NewsletterManagementClient />
    </>
  );
}
