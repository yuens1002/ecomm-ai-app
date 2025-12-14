import { requireAdmin } from "@/lib/admin";
import NewsletterManagementClient from "./NewsletterManagementClient";

export const metadata = {
  title: "Newsletter Subscribers | Admin",
  description: "Manage newsletter subscribers",
};

export default async function NewsletterPage() {
  await requireAdmin();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Newsletter Subscribers</h1>
        <p className="text-muted-foreground mt-2">
          Manage newsletter subscribers and campaigns
        </p>
      </div>
      <NewsletterManagementClient />
    </>
  );
}
