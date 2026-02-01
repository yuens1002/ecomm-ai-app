"use client";

import SubscriptionManagementClient from "./SubscriptionManagementClient";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";

export default function AdminSubscriptionsPage() {
  return (
    <>
      <PageTitle
        title="Subscriptions"
        subtitle="Manage customer subscription orders"
      />
      <SubscriptionManagementClient />
    </>
  );
}
