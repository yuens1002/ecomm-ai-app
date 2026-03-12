"use client";

import OrderManagementClient from "./OrderManagementClient";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { IntegrationBanner } from "@/components/shared/IntegrationBanner";

const stripeConfigured = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function AdminOrdersPage() {
  return (
    <>
      <PageTitle
        title="Order Management"
        subtitle="Manage and fulfill customer orders"
      />
      {!stripeConfigured && (
        <div className="mb-4">
          <IntegrationBanner service="Stripe" />
        </div>
      )}
      <OrderManagementClient />
    </>
  );
}
