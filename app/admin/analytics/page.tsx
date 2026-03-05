import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { ADMIN_PAGES } from "@/lib/config/admin-pages";
import UserAnalyticsClient from "./UserAnalyticsClient";

export default function AdminAnalyticsPage() {
  return (
    <>
      <PageTitle
        title={ADMIN_PAGES.analytics.label}
        subtitle={ADMIN_PAGES.analytics.description}
      />
      <UserAnalyticsClient />
    </>
  );
}
