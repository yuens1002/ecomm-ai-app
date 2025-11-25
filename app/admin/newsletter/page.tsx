import { requireAdmin } from "@/lib/admin";
import NewsletterManagementClient from "./NewsletterManagementClient";

export const metadata = {
  title: "Newsletter Subscribers | Admin",
  description: "Manage newsletter subscribers",
};

export default async function NewsletterPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Newsletter Subscribers
      </h1>
      <NewsletterManagementClient />
    </div>
  );
}
