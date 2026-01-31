"use client";

import AnalyticsView from "./AnalyticsView";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";

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
