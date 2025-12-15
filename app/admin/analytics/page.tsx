"use client";

import AnalyticsView from "./AnalyticsView";
import { PageTitle } from "@/components/admin/PageTitle";

export default function AdminAnalyticsPage() {
  return (
    <>
      <PageTitle
        title="Analytics"
        subtitle="User behavior and product performance insights"
      />
      <AnalyticsView embedded />
    </>
  );
}
