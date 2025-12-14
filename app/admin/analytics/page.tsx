"use client";

import AnalyticsView from "./AnalyticsView";

export default function AdminAnalyticsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          User behavior and product performance insights
        </p>
      </div>
      <AnalyticsView embedded />
    </>
  );
}
